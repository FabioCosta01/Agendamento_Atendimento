process.loadEnvFile('.env');

import { PrismaClient } from '@prisma/client';

import { hashPassword } from '../src/security/password';

const prisma = new PrismaClient();

const serviceCatalog = [
  {
    id: 'seed-servico-siapp',
    classification: 'Agroindustria',
    name: 'Elaboracao de cadastro no SIAPP',
  },
  {
    id: 'seed-servico-instalacoes-e-equipamentos',
    classification: 'Agroindustria',
    name: 'Orientacoes sobre adequacao de instalacoes e equipamentos',
  },
  {
    id: 'seed-servico-boas-praticas-fabricacao',
    classification: 'Agroindustria',
    name: 'Orientacoes sobre boas praticas de fabricacao',
  },
  {
    id: 'seed-servico-rotulo-embalagens',
    classification: 'Agroindustria',
    name: 'Orientacoes sobre construir ou ajustar rotulo de embalagens',
  },
  {
    id: 'seed-servico-agroindustria-animal',
    classification: 'Agroindustria',
    name: 'Orientacoes sobre regularizacao de agroindustria de produtos de origem animal',
  },
  {
    id: 'seed-servico-agroindustria-vegetal',
    classification: 'Agroindustria',
    name: 'Orientacoes sobre regularizacao de agroindustria de produtos de origem vegetal',
  },
  {
    id: 'seed-servico-gestao-pecuaria',
    classification: 'Assistencia tecnica produtiva ANIMAL',
    name: 'Orientacao de gestao do negocio pecuario',
  },
  {
    id: 'seed-servico-outros-animais',
    classification: 'Assistencia tecnica produtiva ANIMAL',
    name: 'Orientacoes sobre aves, suinos, peixes, abelhas ou outros animais',
  },
  {
    id: 'seed-servico-gado-leite-corte',
    classification: 'Assistencia tecnica produtiva ANIMAL',
    name: 'Orientacoes sobre gado de leite ou de corte',
  },
  {
    id: 'seed-servico-gestao-agricola',
    classification: 'Assistencia tecnica produtiva VEGETAL',
    name: 'Orientacao de gestao do negocio agricola',
  },
  {
    id: 'seed-servico-colheita-venda',
    classification: 'Assistencia tecnica produtiva VEGETAL',
    name: 'Orientacoes sobre colheita, beneficiamentos e venda',
  },
  {
    id: 'seed-servico-lavoura-manejo',
    classification: 'Assistencia tecnica produtiva VEGETAL',
    name: 'Orientacoes sobre iniciar lavoura, manejo de solo, pragas, doencas e tratos culturais',
  },
  {
    id: 'seed-servico-mt-produtivo',
    classification: 'Associacoes, cooperativas e comunidade',
    name: 'Orientacoes e elaboracao de plano de negocio para o MT PRODUTIVO',
  },
  {
    id: 'seed-servico-acoes-coletivas',
    classification: 'Associacoes, cooperativas e comunidade',
    name: 'Orientacoes sobre acoes coletivas ou em comunidade',
  },
  {
    id: 'seed-servico-criar-associacao',
    classification: 'Associacoes, cooperativas e comunidade',
    name: 'Orientacoes sobre criacao ou regularizacao de associacao ou cooperativa',
  },
  {
    id: 'seed-servico-gestao-associacao',
    classification: 'Associacoes, cooperativas e comunidade',
    name: 'Orientacoes sobre gestao da associacao ou cooperativa',
  },
  {
    id: 'seed-servico-caf-associacao',
    classification: 'CAF - Cadastro da Agricultura Familiar',
    name: 'Fazer ou atualizar o CAF da associacao ou cooperativa',
  },
  {
    id: 'seed-servico-caf-individual',
    classification: 'CAF - Cadastro da Agricultura Familiar',
    name: 'Fazer ou atualizar o CAF individual',
  },
  {
    id: 'seed-servico-caf-orientacoes',
    classification: 'CAF - Cadastro da Agricultura Familiar',
    name: 'Orientacoes sobre o CAF',
  },
  {
    id: 'seed-servico-projeto-venda-pnae-paa',
    classification: 'Comercializacao e mercados institucionais - PNAE PAA e outros',
    name: 'Elaboracao do projeto de venda para PNAE, PAA ou outro orgao publico',
  },
  {
    id: 'seed-servico-feiras-mercados',
    classification: 'Comercializacao e mercados institucionais - PNAE PAA e outros',
    name: 'Orientacoes para venda em feiras ou mercados privados',
  },
  {
    id: 'seed-servico-vender-paa-pnae',
    classification: 'Comercializacao e mercados institucionais - PNAE PAA e outros',
    name: 'Orientacoes para vender ao PAA, PNAE ou Orgao Publico',
  },
  {
    id: 'seed-servico-limite-credito',
    classification: 'Credito e financiamento rural',
    name: 'Atualizacao de cadastro ou limite de credito',
  },
  {
    id: 'seed-servico-fco-rural',
    classification: 'Credito e financiamento rural',
    name: 'Orientacao e elaboracao de projeto de financiamento FCO Rural',
  },
  {
    id: 'seed-servico-fundaaf-agroindustria',
    classification: 'Credito e financiamento rural',
    name: 'Orientacao e elaboracao de projeto de financiamento FUNDAAF 2.1 - Agroindustria',
  },
  {
    id: 'seed-servico-fundaaf-incentivo',
    classification: 'Credito e financiamento rural',
    name: 'Orientacao e elaboracao de projeto de financiamento FUNDAAF 2.1 - Incentivo Produtivo',
  },
  {
    id: 'seed-servico-pronaf',
    classification: 'Credito e financiamento rural',
    name: 'Orientacao e elaboracao de projeto de financiamento PRONAF',
  },
  {
    id: 'seed-servico-pronamp',
    classification: 'Credito e financiamento rural',
    name: 'Orientacao e elaboracao de projeto de financiamento PRONAMP',
  },
  {
    id: 'seed-servico-dividas-credito',
    classification: 'Credito e financiamento rural',
    name: 'Orientacao e renegociacao de dividas de credito',
  },
  {
    id: 'seed-servico-fomento-fundaaf',
    classification: 'Fomento produtivo e inclusao rural',
    name: 'Orientacoes e elaboracao de projeto de fomento FUNDAAF 2.2 - Inclusao Rural',
  },
  {
    id: 'seed-servico-fomento-mds',
    classification: 'Fomento produtivo e inclusao rural',
    name: 'Orientacoes e elaboracao de projeto de Fomento MDS',
  },
  {
    id: 'seed-servico-fomento-incra',
    classification: 'Fomento produtivo e inclusao rural',
    name: 'Orientacoes e elaboracao de projeto de fomento rural INCRA',
  },
  {
    id: 'seed-servico-lixo-residuos',
    classification: 'Meio ambiente e sustentabilidade rural',
    name: 'Orientacoes sobre destinacao de lixo, residuos e efluentes',
  },
  {
    id: 'seed-servico-regularizacao-ambiental',
    classification: 'Meio ambiente e sustentabilidade rural',
    name: 'Orientacoes sobre regularizacao ambiental, APF, CAR, PRA ou licenciamento',
  },
  {
    id: 'seed-servico-nascentes-rio-represa',
    classification: 'Meio ambiente e sustentabilidade rural',
    name: 'Orientacoes sobre uso e protecao de nascentes, rio ou represa',
  },
  {
    id: 'seed-servico-outros-atendimentos',
    classification: 'Outros atendimentos',
    name: 'Emissao de declaracoes, laudos tecnicos, parecer tecnico, consultas documentais, outras politicas publicas, etc',
  },
  {
    id: 'seed-servico-atividade-turistica',
    classification: 'Turismo rural',
    name: 'Orientacoes sobre organizacao da atividade turistica com produtos, cultura e paisagem local',
  },
  {
    id: 'seed-servico-artesanatos',
    classification: 'Turismo rural',
    name: 'Orientacoes sobre producao e venda de artesanatos',
  },
];

const serviceMunicipalities = [
  'Cláudia',
  'Feliz Natal',
  'Ipiranga do Norte',
  'Itanhangá',
  'Itaúba',
  'Lucas do Rio Verde',
  'Marcelândia',
  'Nova Mutum',
  'Nova Fronteira',
  'Nova Ubiratã',
  'Nova Santa Helena',
  'Santa Rita do Trivelato',
  'Santa Carmem',
  'Sinop',
  'Sorriso',
  'Tabaporã',
  'Tapurah',
  'União do Sul',
  'Vera',
  'Alto Paraguai e Distrito de Capão Verde',
  'Arenápolis',
  'Barra do Bugres',
  'Campo Novo do Parecis',
  'Capão Verde/Alto Paraguai',
  'Denise',
  'Diamantino',
  'Nortelândia',
  'Nova Marilândia',
  'Nova Maringá',
  'Nova Olímpia',
  'Porto Estrela',
  'São José do Rio Claro',
  'Tangará da Serra',
  'Santo Afonso',
  'Sapezal',
  'Alto Boa Vista',
  'Bom Jesus do Araguaia',
  'Canabrava do Norte',
  'Confresa',
  'Luciara',
  'Novo Santo Antônio',
  'Porto Alegre do Norte',
  'Santa Cruz do Xingu',
  'Santa Terezinha',
  'São Félix do Araguaia',
  'São José do Xingu',
  'Serra Nova Dourada',
  'Vila Rica',
  'Cáceres',
  'Araputanga',
  'Campos de Júlio',
  'Comodoro',
  "Conquista D'Oeste",
  'Curvelândia',
  "Figueirópolis D'Oeste",
  "Glória D'Oeste",
  'Jauru',
  'Indavaí',
  "Lambari D'Oeste",
  "Mirassol D'Oeste",
  'Nova Lacerda',
  'Pontes e Lacerda',
  'Porto Esperidião',
  'Reserva do Cabaçal',
  'Rio Branco',
  'Salto do Céu',
  'São José dos Quatro Marcos',
  'Vale de São Domingos',
  'Vila Bela da Santíssima Trindade',
  'Alta Floresta',
  'Apiacás',
  'Carlinda',
  'Colíder',
  'Guarantã do Norte',
  'Matupá',
  'Nova Bandeirantes',
  'Nova Canaã do Norte',
  'Nova Guarita',
  'Nova Monte Verde',
  'Novo Mundo',
  'Peixoto de Azevedo',
  'Paranaíta',
  'Terra Nova do Norte',
  'Água Boa',
  'Araguainha',
  'Araguaiana',
  'Barra do Garças',
  'Campinápolis',
  'Canarana',
  'Cocalinho',
  'General Carneiro',
  'Nova Xavantina',
  'Novo São Joaquim',
  'Pontal do Araguaia',
  'Ponte Branca',
  'Querência',
  'Ribeirão Cascalheira',
  'Ribeirãozinho',
  'Gaúcha do Norte',
  'Torixoréu',
  'Alto Araguaia',
  'Alto Taquari',
  'Alto Garças',
  'Campo Verde',
  'Dom Aquino',
  'Guiratinga',
  'Itiquira',
  'Jaciara',
  'Juscimeira',
  'Paranatinga',
  'Pedra Preta',
  'Poxoréu',
  'Primavera do Leste',
  'Rondonópolis',
  'Santo Antônio do Leste',
  'São José do Povo',
  'São Pedro da Cipa',
  'Tesouro',
  'Juína',
  'Aripuanã',
  'Brasnorte',
  'Castanheira',
  'Colniza',
  'Cotriguaçu',
  'Juara',
  'Juruena',
  'Novo Horizonte do Norte',
  'Porto dos Gaúchos',
  'Rondolândia',
  'Acorizal',
  'Barão de Melgaço',
  'Agrovila das Palmeiras',
  'Chapada dos Guimarães',
  'Cuiabá',
  'Várzea Grande',
  'Nobres',
  'Nossa Senhora do Livramento',
  'Nova Brasilândia',
  'Poconé',
  'Rosário Oeste',
  'Santo Antônio de Leverger',
  'Planalto da Serra',
];

async function main() {
  const defaultPasswordHash = hashPassword('123456');

  const admin = await prisma.user.upsert({
    where: { email: 'admin@agendamento.local' },
    update: {},
    create: {
      name: 'Administrador Inicial',
      email: 'admin@agendamento.local',
      document: '00000000000',
      passwordHash: defaultPasswordHash,
      role: 'ADMINISTRADOR',
    },
  });

  const extensionist = await prisma.user.upsert({
    where: { email: 'extensionista@agendamento.local' },
    update: {},
    create: {
      name: 'Extensionista Padrao',
      email: 'extensionista@agendamento.local',
      document: '11111111111',
      passwordHash: defaultPasswordHash,
      role: 'EXTENSIONISTA',
      phone: '65999999999',
    },
  });

  const requester = await prisma.user.upsert({
    where: { email: 'solicitante@agendamento.local' },
    update: {},
    create: {
      name: 'Solicitante Padrao',
      email: 'solicitante@agendamento.local',
      document: '22222222222',
      passwordHash: defaultPasswordHash,
      role: 'SOLICITANTE',
      phone: '65988888888',
    },
  });

  await prisma.service
    .update({
      where: { id: 'seed-vistoria-inicial' },
      data: { active: false },
    })
    .catch(() => undefined);

  for (const municipality of serviceMunicipalities) {
    await prisma.serviceMunicipality.upsert({
      where: {
        name_state: {
          name: municipality,
          state: 'MT',
        },
      },
      update: {
        active: true,
      },
      create: {
        name: municipality,
        state: 'MT',
        active: true,
      },
    });
  }

  for (const service of serviceCatalog) {
    await prisma.service.upsert({
      where: { id: service.id },
      update: {
        classification: service.classification,
        name: service.name,
        durationMinutes: 60,
        active: true,
      },
      create: {
        ...service,
        description: null,
        durationMinutes: 60,
        active: true,
      },
    });
  }

  await prisma.property.upsert({
    where: { id: 'seed-fazenda-modelo' },
    update: {},
    create: {
      id: 'seed-fazenda-modelo',
      ownerId: requester.id,
      ownerName: 'Solicitante Padrao',
      ownerDocument: requester.document,
      displayName: 'Fazenda Modelo',
      city: 'Cuiaba',
      state: 'MT',
      address: 'Zona Rural',
      funruralCode: 'FUNRURAL-001',
      ruralRegistry: 'CAR-001',
      hasHabiteSe: false,
    },
  });

  await prisma.availability.upsert({
    where: { id: 'seed-disponibilidade-1' },
    update: {},
    create: {
      id: 'seed-disponibilidade-1',
      extensionistId: extensionist.id,
      startDateTime: new Date('2026-04-21T13:00:00.000Z'),
      endDateTime: new Date('2026-04-21T17:00:00.000Z'),
      capacity: 4,
      notes: 'Bloco inicial de atendimento',
    },
  });

  console.log('Seed concluido');
  console.log({
    admin: { document: admin.document, password: '123456' },
    extensionist: { document: extensionist.document, password: '123456' },
    requester: { document: requester.document, password: '123456' },
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
