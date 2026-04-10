export interface DISCQuestion {
  id: number;
  text: string;
  dimension: "D" | "I" | "S" | "C";
}

export const discQuestions: DISCQuestion[] = [
  // D - Dominância
  { id: 1, text: "Assumo a liderança de situações complexas.", dimension: "D" },
  { id: 2, text: "Comunico decisões com objetividade, mesmo sob pressão.", dimension: "D" },
  { id: 3, text: "Gosto de metas desafiadoras e acompanho indicadores de resultado.", dimension: "D" },
  { id: 4, text: "Tomo decisões rápidas com informações incompletas.", dimension: "D" },
  { id: 5, text: "Sinto-me motivado(a) por desafios e competição saudável.", dimension: "D" },
  { id: 6, text: "Confronto problemas difíceis sem adiar conversas.", dimension: "D" },
  { id: 7, text: "Prefiro autonomia para o desenvolvimento de soluções.", dimension: "D" },
  { id: 8, text: "Cobro ritmo e entrega quando os prazos apertam.", dimension: "D" },
  { id: 9, text: "Aceito correr riscos para alcançar resultados.", dimension: "D" },
  { id: 10, text: "Redireciono planos rapidamente quando algo não funciona.", dimension: "D" },

  // I - Influência
  { id: 11, text: "Crio conexão com pessoas novas com facilidade.", dimension: "I" },
  { id: 12, text: "Uso comunicação positiva para engajar o time.", dimension: "I" },
  { id: 13, text: "Apresento ideias com entusiasmo e influência.", dimension: "I" },
  { id: 14, text: "Sinto-me motivado com trabalhos em equipe.", dimension: "I" },
  { id: 15, text: "Busco reconhecimento e feedback sobre minhas contribuições.", dimension: "I" },
  { id: 16, text: "Tenho facilidade para mediar conversas e aproximar áreas.", dimension: "I" },
  { id: 17, text: "Adapto minha linguagem ao público para gerar adesão.", dimension: "I" },
  { id: 18, text: "Estimulo o grupo com otimismo em momentos de pressão.", dimension: "I" },
  { id: 19, text: "Prefiro aprender trocando experiências com outras pessoas.", dimension: "I" },
  { id: 20, text: "Gosto de representar o time em reuniões e apresentações.", dimension: "I" },

  // S - Estabilidade
  { id: 21, text: "Mantenho constância de entrega mesmo em rotinas longas.", dimension: "S" },
  { id: 22, text: "Escuto com atenção antes de propor soluções.", dimension: "S" },
  { id: 23, text: "Contribuo para um ambiente respeitoso e cooperativo.", dimension: "S" },
  { id: 24, text: "Cumpro acordos e acompanho combinados até o fim.", dimension: "S" },
  { id: 25, text: "Prefiro mudanças graduais do que repentinas.", dimension: "S" },
  { id: 26, text: "Ofereço apoio quando colegas enfrentam dificuldades.", dimension: "S" },
  { id: 27, text: "Penso no impacto das decisões sobre as pessoas.", dimension: "S" },
  { id: 28, text: "Trabalho bem com processos definidos e bem estruturados.", dimension: "S" },
  { id: 29, text: "Mantenho calma e equilíbrio em situações de tensão.", dimension: "S" },
  { id: 30, text: "Sou paciente em ensinar e colaborar com os colegas.", dimension: "S" },

  // C - Conformidade
  { id: 31, text: "Verifico detalhes críticos antes de concluir uma tarefa.", dimension: "C" },
  { id: 32, text: "Valorizo critérios de qualidade e precisão técnica.", dimension: "C" },
  { id: 33, text: "Sigo padrões e procedimentos para reduzir erros.", dimension: "C" },
  { id: 34, text: "Baseio decisões em dados, evidências e análise.", dimension: "C" },
  { id: 35, text: "Estruturo atividades com método e organização.", dimension: "C" },
  { id: 36, text: "Identifico inconsistências que podem comprometer resultados.", dimension: "C" },
  { id: 37, text: "Documento processos para garantir rastreabilidade.", dimension: "C" },
  { id: 38, text: "Avalio riscos e cenários antes de aprovar mudanças.", dimension: "C" },
  { id: 39, text: "Planejo com antecedência para minimizar imprevistos.", dimension: "C" },
  { id: 40, text: "Questiono processos e procedimentos para garantir a melhoria contínua.", dimension: "C" },
];

export const scaleLabels = ["Nunca", "Raramente", "Às vezes", "Frequentemente", "Sempre"];
