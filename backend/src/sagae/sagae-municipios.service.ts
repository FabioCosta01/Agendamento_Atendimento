import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

type SagaeMunicipalityResponse = {
  id?: unknown;
  nome?: unknown;
  estado?: unknown;
  latitude?: unknown;
  longitude?: unknown;
};

export type SagaeMunicipality = {
  id: string;
  name: string;
  state: string;
  active: true;
  latitude: number | null;
  longitude: number | null;
};

type MunicipalityLink = {
  municipalityId: string;
};

@Injectable()
export class SagaeMunicipiosService {
  private readonly logger = new Logger(SagaeMunicipiosService.name);
  private readonly endpoint: string;

  constructor(private readonly configService: ConfigService) {
    this.endpoint = this.configService.get<string>(
      'SAGAE_MUNICIPIOS_URL',
      'http://teste.sagae.empaer.mt.gov.br:8080/api/municipios',
    );
  }

  async findAll() {
    const municipalities = await this.fetchMunicipalities();

    return municipalities.sort((first, second) => first.name.localeCompare(second.name, 'pt-BR'));
  }

  async findMapByIds(ids: string[]) {
    const uniqueIds = Array.from(new Set(ids.map((id) => id.trim()).filter(Boolean)));

    if (uniqueIds.length === 0) {
      return new Map<string, SagaeMunicipality>();
    }

    const municipalities = await this.findAll();
    const municipalityMap = new Map(municipalities.map((municipality) => [municipality.id, municipality]));

    const entries: Array<[string, SagaeMunicipality | undefined]> = uniqueIds.map((id) => [
      id,
      municipalityMap.get(id),
    ]);

    return new Map(entries.filter(this.hasMunicipality));
  }

  async ensureMunicipalityIdsExist(ids: string[]) {
    const uniqueIds = Array.from(new Set(ids.map((id) => id.trim()).filter(Boolean)));

    if (uniqueIds.length === 0) {
      return [];
    }

    const municipalityMap = await this.findMapByIds(uniqueIds);

    if (municipalityMap.size !== uniqueIds.length) {
      throw new ServiceUnavailableException('Um ou mais municipios nao foram encontrados na API do SAGAe');
    }

    return uniqueIds;
  }

  async hydrateAttendanceMunicipalities<T extends { attendanceMunicipalities?: MunicipalityLink[] }>(records: T[]) {
    const municipalityIds = records.flatMap((record) =>
      record.attendanceMunicipalities?.map((item) => item.municipalityId) ?? [],
    );
    const municipalityMap = await this.findMapByIds(municipalityIds);

    return records.map((record) => ({
      ...record,
      attendanceMunicipalities:
        record.attendanceMunicipalities
          ?.map((item) => {
            const municipality = municipalityMap.get(item.municipalityId);

            return municipality ? { municipality } : undefined;
          })
          .filter((item): item is { municipality: SagaeMunicipality } => Boolean(item)) ?? [],
    }));
  }

  async hydrateAttendanceMunicipality<T extends { attendanceMunicipalities?: MunicipalityLink[] }>(record: T) {
    const [hydratedRecord] = await this.hydrateAttendanceMunicipalities([record]);

    return hydratedRecord;
  }

  async attachMunicipalitiesToAvailabilities<T extends { municipalityId?: string | null }>(records: T[]) {
    const municipalityIds = records.map((record) => record.municipalityId).filter((id): id is string => Boolean(id));
    const municipalityMap = await this.findMapByIds(municipalityIds);

    return records.map((record) => ({
      ...record,
      municipality: record.municipalityId ? (municipalityMap.get(record.municipalityId) ?? null) : null,
    }));
  }

  async attachMunicipalityToAvailability<T extends { municipalityId?: string | null }>(record: T) {
    const [hydratedRecord] = await this.attachMunicipalitiesToAvailabilities([record]);

    return hydratedRecord;
  }

  async attachMunicipalitiesToAppointments<T extends { availability?: ({ municipalityId?: string | null } & Record<string, unknown>) | null }>(
    records: T[],
  ) {
    const availabilityRecords = records
      .map((record) => record.availability)
      .filter((availability): availability is NonNullable<T['availability']> => Boolean(availability));
    const hydratedAvailabilities = await this.attachMunicipalitiesToAvailabilities(availabilityRecords);
    const hydratedByIndex = new Map(hydratedAvailabilities.map((availability, index) => [availabilityRecords[index], availability]));

    return records.map((record) => ({
      ...record,
      availability: record.availability ? (hydratedByIndex.get(record.availability) ?? record.availability) : record.availability,
    }));
  }

  async attachMunicipalitiesToAppointment<
    T extends { availability?: ({ municipalityId?: string | null } & Record<string, unknown>) | null },
  >(record: T) {
    const [hydratedRecord] = await this.attachMunicipalitiesToAppointments([record]);

    return hydratedRecord;
  }

  private async fetchMunicipalities() {
    const abortController = new AbortController();
    const timeout = setTimeout(() => abortController.abort(), 8000);

    try {
      const response = await fetch(this.endpoint, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
        },
        signal: abortController.signal,
      });

      if (!response.ok) {
        throw new Error(`SAGAe retornou HTTP ${response.status}`);
      }

      const payload = (await response.json()) as unknown;
      const municipalities = this.extractMunicipalities(payload)
        .map((item) => this.normalizeMunicipality(item))
        .filter((municipality) => municipality.state === 'MT');

      if (municipalities.length === 0) {
        throw new Error('SAGAe retornou lista de municipios de MT vazia');
      }

      return municipalities;
    } catch (error) {
      this.logger.error(`Falha ao consultar municipios no SAGAe: ${error instanceof Error ? error.message : 'erro desconhecido'}`);
      throw new ServiceUnavailableException('API de municipios do SAGAe indisponivel. Tente novamente em instantes.');
    } finally {
      clearTimeout(timeout);
    }
  }

  private extractMunicipalities(payload: unknown): SagaeMunicipalityResponse[] {
    if (Array.isArray(payload)) {
      return payload as SagaeMunicipalityResponse[];
    }

    if (payload && typeof payload === 'object') {
      const candidate = payload as { data?: unknown; items?: unknown; value?: unknown };

      if (Array.isArray(candidate.data)) {
        return candidate.data as SagaeMunicipalityResponse[];
      }

      if (Array.isArray(candidate.items)) {
        return candidate.items as SagaeMunicipalityResponse[];
      }

      if (Array.isArray(candidate.value)) {
        return candidate.value as SagaeMunicipalityResponse[];
      }
    }

    throw new Error('Formato invalido retornado pela API de municipios do SAGAe');
  }

  private normalizeMunicipality(item: SagaeMunicipalityResponse): SagaeMunicipality {
    const id = String(item.id ?? '').trim();
    const name = String(item.nome ?? '').trim();
    const state = String(item.estado ?? '').trim().toUpperCase();

    if (!id || !name || !state) {
      throw new Error('Municipio do SAGAe sem id, nome ou estado');
    }

    return {
      id,
      name,
      state,
      active: true,
      latitude: typeof item.latitude === 'number' ? item.latitude : null,
      longitude: typeof item.longitude === 'number' ? item.longitude : null,
    };
  }

  private hasMunicipality(entry: [string, SagaeMunicipality | undefined]): entry is [string, SagaeMunicipality] {
    return Boolean(entry[1]);
  }
}

