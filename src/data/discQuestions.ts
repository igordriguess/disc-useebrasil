export interface DISCQuestion {
  id: number;
  text: string;
  dimension: "D" | "I" | "S" | "C";
}

export const discQuestions: DISCQuestion[] = [
  // D - Dominância
  { id: 1, text: "Eu gosto de assumir o controle das situações.", dimension: "D" },
  { id: 2, text: "Sou direto ao comunicar minhas ideias.", dimension: "D" },
  { id: 3, text: "Busco resultados rápidos e concretos.", dimension: "D" },
  { id: 4, text: "Não tenho medo de tomar decisões difíceis.", dimension: "D" },
  { id: 5, text: "Prefiro liderar do que seguir.", dimension: "D" },
  { id: 6, text: "Sou competitivo e gosto de vencer desafios.", dimension: "D" },
  { id: 7, text: "Fico impaciente com processos lentos.", dimension: "D" },
  { id: 8, text: "Gosto de resolver problemas de forma independente.", dimension: "D" },
  { id: 9, text: "Aceito riscos com facilidade.", dimension: "D" },
  { id: 10, text: "Questiono o resultado e busco melhorias.", dimension: "D" },

  // I - Influência
  { id: 11, text: "Sou entusiasmado e otimista por natureza.", dimension: "I" },
  { id: 12, text: "Gosto de trabalhar em equipe e colaborar.", dimension: "I" },
  { id: 13, text: "Tenho facilidade em persuadir e motivar outros.", dimension: "I" },
  { id: 14, text: "Prefiro ambientes de trabalho dinâmicos e sociais.", dimension: "I" },
  { id: 15, text: "Sou criativo e gosto de gerar novas ideias.", dimension: "I" },
  { id: 16, text: "Gosto de ser reconhecido pelo meu trabalho.", dimension: "I" },
  { id: 17, text: "Construo relacionamentos com facilidade.", dimension: "I" },
  { id: 18, text: "Prefiro conversas informais a reuniões estruturadas.", dimension: "I" },
  { id: 19, text: "Sou expressivo e demonstro minhas emoções.", dimension: "I" },
  { id: 20, text: "Gosto de inspirar e encorajar as pessoas ao meu redor.", dimension: "I" },

  // S - Estabilidade
  { id: 21, text: "Valorizo estabilidade e previsibilidade no trabalho.", dimension: "S" },
  { id: 22, text: "Sou paciente e bom ouvinte.", dimension: "S" },
  { id: 23, text: "Prefiro ambientes harmoniosos e sem conflitos.", dimension: "S" },
  { id: 24, text: "Sou leal e comprometido com minha equipe.", dimension: "S" },
  { id: 25, text: "Prefiro rotinas consistentes a mudanças frequentes.", dimension: "S" },
  { id: 26, text: "Ajudo os outros mesmo quando não me pedem.", dimension: "S" },
  { id: 27, text: "Tenho dificuldade em dizer não.", dimension: "S" },
  { id: 28, text: "Priorizo o bem-estar coletivo acima do individual.", dimension: "S" },
  { id: 29, text: "Sou calmo sob pressão.", dimension: "S" },
  { id: 30, text: "Prefiro trabalhar em passo constante e seguro.", dimension: "S" },

  // C - Conformidade
  { id: 31, text: "Sou detalhista e minucioso no meu trabalho.", dimension: "C" },
  { id: 32, text: "Valorizo precisão e qualidade acima da velocidade.", dimension: "C" },
  { id: 33, text: "Gosto de seguir regras e procedimentos estabelecidos.", dimension: "C" },
  { id: 34, text: "Analiso dados antes de tomar decisões.", dimension: "C" },
  { id: 35, text: "Sou organizado e metódico.", dimension: "C" },
  { id: 36, text: "Prefiro trabalhar com fatos e lógica.", dimension: "C" },
  { id: 37, text: "Busco a perfeição no que faço.", dimension: "C" },
  { id: 38, text: "Sou cauteloso e evito riscos desnecessários.", dimension: "C" },
  { id: 39, text: "Gosto de planejar antes de agir.", dimension: "C" },
  { id: 40, text: "Questiono informações até ter certeza da resposta.", dimension: "C" },
];

export const scaleLabels = ["Nunca", "Raramente", "Às vezes", "Frequentemente", "Sempre"];
