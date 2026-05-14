import {
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

type SagaeExtensionistPayload = Record<string, unknown>;

export type SagaeExtensionist = {
  sagaeId: string | null;
  name: string;
  document: string;
  email: string | null;
  phone: string | null;
  active: boolean;
  municipalityIds: string[];
};

@Injectable()
export class SagaeExtensionistasService {
  private readonly logger = new Logger(SagaeExtensionistasService.name);
  private readonly endpoint: string;
  private readonly token?: string;

  constructor(private readonly configService: ConfigService) {
    this.endpoint = this.configService.get<string>(
      'SAGAE_EXTENSIONISTAS_LOGIN_URL',
      'http://teste.sagae.empaer.mt.gov.br:8080/api/login',
    );
    this.token = this.configService.get<string>('SAGAE_API_TOKEN')?.trim() || undefined;
  }

  async authenticate(document: string, password: string): Promise<SagaeExtensionist> {
    const documentDigits = document.replace(/\D/g, '');

    if (!this.isValidCpf(documentDigits)) {
      throw new UnauthorizedException('CPF ou senha invalidos');
    }

    const abortController = new AbortController();
    const timeout = setTimeout(() => abortController.abort(), 8000);

    try {
      const response = await fetch(this.endpoint, {
        method: 'POST',
        headers: this.buildHeaders(),
        body: JSON.stringify({
          login: this.formatCpf(documentDigits),
          senha: password,
        }),
        signal: abortController.signal,
      });

      if (response.status === 401) {
        throw new UnauthorizedException('CPF ou senha invalidos');
      }

      if (response.status === 403) {
        throw new ForbiddenException('Extensionista sem permissao de acesso');
      }

      if (response.status === 404) {
        throw new NotFoundException('Extensionista nao encontrado no SAGAe');
      }

      if (!response.ok) {
        throw new ServiceUnavailableException('API de extensionistas do SAGAe indisponivel');
      }

      const payload = (await response.json()) as unknown;
      return this.normalizeExtensionist(payload, documentDigits);
    } catch (error) {
      if (
        error instanceof UnauthorizedException ||
        error instanceof ForbiddenException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }

      this.logger.error(`Falha ao autenticar extensionista no SAGAe: ${error instanceof Error ? error.message : 'erro desconhecido'}`);
      throw new ServiceUnavailableException('API de extensionistas do SAGAe indisponivel. Tente novamente em instantes.');
    } finally {
      clearTimeout(timeout);
    }
  }

  private buildHeaders() {
    const headers: Record<string, string> = {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    };

    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    return headers;
  }

  private normalizeExtensionist(payload: unknown, fallbackDocument: string): SagaeExtensionist {
    const data = this.extractExtensionist(payload);
    const document = this.readString(data, ['cpf', 'documento', 'document', 'login'])?.replace(/\D/g, '') || fallbackDocument;
    const name = this.readString(data, ['nome', 'name', 'nomeCompleto', 'nome_completo']);
    const sagaeId = this.readString(data, ['idSagae', 'id_sagae', 'codigoSagae', 'codigo_sagae', 'id', 'codigo']);
    const email = this.readString(data, ['email', 'e-mail', 'mail']);
    const phone = this.readString(data, ['telefone', 'phone', 'celular'])?.replace(/\D/g, '') ?? null;
    const active = this.readActive(data);

    if (!this.isValidCpf(document)) {
      throw new UnauthorizedException('CPF retornado pelo SAGAe e invalido');
    }

    if (!name) {
      throw new ServiceUnavailableException('Dados do extensionista incompletos no SAGAe');
    }

    if (!active) {
      throw new ForbiddenException('Extensionista inativo no SAGAe');
    }

    if (!this.hasExtensionistPermission(data)) {
      throw new ForbiddenException('Perfil do SAGAe nao autorizado para acesso');
    }

    return {
      sagaeId: sagaeId ?? null,
      name,
      document,
      email: email?.trim().toLowerCase() || null,
      phone,
      active,
      municipalityIds: this.readMunicipalityIds(data),
    };
  }

  private extractExtensionist(payload: unknown): SagaeExtensionistPayload {
    if (!payload || typeof payload !== 'object') {
      throw new ServiceUnavailableException('Formato invalido retornado pelo SAGAe');
    }

    const candidate = payload as SagaeExtensionistPayload & {
      data?: unknown;
      user?: unknown;
      usuario?: unknown;
      extensionista?: unknown;
      servidor?: unknown;
    };
    const nested = candidate.data ?? candidate.extensionista ?? candidate.usuario ?? candidate.user ?? candidate.servidor ?? payload;

    if (!nested || typeof nested !== 'object') {
      throw new ServiceUnavailableException('Formato invalido retornado pelo SAGAe');
    }

    return nested as SagaeExtensionistPayload;
  }

  private readString(payload: SagaeExtensionistPayload, keys: string[]) {
    for (const key of keys) {
      const value = payload[key];

      if (typeof value === 'string' && value.trim()) {
        return value.trim();
      }

      if (typeof value === 'number' && Number.isFinite(value)) {
        return String(value);
      }
    }

    return null;
  }

  private readActive(payload: SagaeExtensionistPayload) {
    const value = payload.ativo ?? payload.active ?? payload.status ?? payload.situacao;

    if (typeof value === 'boolean') {
      return value;
    }

    if (typeof value === 'number') {
      return value === 1;
    }

    if (typeof value === 'string') {
      const normalized = value.trim().toLowerCase();
      return ['ativo', 'ativa', 'active', '1', 'true', 'habilitado', 'liberado'].includes(normalized);
    }

    return true;
  }

  private hasExtensionistPermission(payload: SagaeExtensionistPayload) {
    const permission = payload.permitido ?? payload.autorizado ?? payload.acessoPermitido ?? payload.acesso_permitido;

    if (permission === false || permission === 0) {
      return false;
    }

    const profile = this.readString(payload, ['perfil', 'role', 'tipo', 'cargo', 'funcao']);
    if (!profile) {
      return true;
    }

    return /\b(extensionista|tecnico|tecnica|t[eé]cnico|t[eé]cnica|ater)\b/i.test(profile);
  }

  private readMunicipalityIds(payload: SagaeExtensionistPayload) {
    const rawMunicipalities =
      payload.municipios ?? payload.municipalities ?? payload.pontosAtendimento ?? payload.pontos_atendimento ?? [];
    const items = Array.isArray(rawMunicipalities) ? rawMunicipalities : [rawMunicipalities];
    const ids = items
      .map((item) => {
        if (typeof item === 'string' || typeof item === 'number') {
          return String(item).trim();
        }

        if (item && typeof item === 'object') {
          return this.readString(item as SagaeExtensionistPayload, ['id', 'municipioId', 'municipio_id', 'codigo']);
        }

        return null;
      })
      .filter((id): id is string => Boolean(id));

    return Array.from(new Set(ids));
  }

  private formatCpf(document: string) {
    return document.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  }

  private isValidCpf(document: string) {
    if (!/^\d{11}$/.test(document) || /^(\d)\1{10}$/.test(document)) {
      return false;
    }

    const digits = document.split('').map(Number);
    const firstCheck = this.calculateCpfCheckDigit(digits.slice(0, 9), 10);
    const secondCheck = this.calculateCpfCheckDigit([...digits.slice(0, 9), firstCheck], 11);

    return digits[9] === firstCheck && digits[10] === secondCheck;
  }

  private calculateCpfCheckDigit(numbers: number[], weight: number) {
    const sum = numbers.reduce((total, number) => {
      const nextTotal = total + number * weight;
      weight -= 1;

      return nextTotal;
    }, 0);
    const remainder = (sum * 10) % 11;

    return remainder === 10 ? 0 : remainder;
  }
}

