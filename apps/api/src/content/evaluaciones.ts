// Contenido inicial de las evaluaciones (se carga en la base al iniciar la API, ver db/seedContent.ts).
// Los identificadores son fijos para que el contenido sea el mismo en cualquier base.
// Las preguntas son de alternativas; las rúbricas de writing y speaking de la coordinación
// de inglés quedan como referencia para una futura evaluación de respuesta abierta.
import type { EnglishLevel, Skill } from "@grupo-estudio/types";

export interface QuestionContent {
  id: string;
  skill: Skill;
  competency: string;
  prompt: string;
  options: string[];
  correctIndex: number; // nunca se envía al cliente (H5)
}

export interface EvaluationContent {
  id: string;
  title: string;
  questions: QuestionContent[];
}

export interface WeeklyTestContent extends EvaluationContent {
  skill: Skill;
  level: EnglishLevel;
}

export const DIAGNOSTICO: EvaluationContent = {
  "id": "d1e12d6d-1299-4a63-818a-e296c8eefea3",
  "title": "Evaluación diagnóstica de inglés",
  "questions": [
    {
      "id": "17e02bc4-ad89-4bd5-9029-3a34fb61d416",
      "skill": "reading",
      "competency": "Vocabulario",
      "prompt": "Choose the word that means 'biblioteca':",
      "options": [
        "Bookstore",
        "Library",
        "Classroom",
        "Office"
      ],
      "correctIndex": 1
    },
    {
      "id": "39145d95-0fcd-4d50-a531-a299ae54b332",
      "skill": "reading",
      "competency": "Vocabulario",
      "prompt": "\"The workshop was postponed due to unforeseen circumstances.\" ¿Qué significa 'postponed'?",
      "options": [
        "Cancelado",
        "Pospuesto",
        "Confirmado",
        "Reducido"
      ],
      "correctIndex": 1
    },
    {
      "id": "4c3a4658-33df-4c31-9dbb-a01dfeece858",
      "skill": "reading",
      "competency": "Vocabulario",
      "prompt": "El sinónimo más cercano a 'crucial' es:",
      "options": [
        "Opcional",
        "Irrelevante",
        "Esencial",
        "Tardío"
      ],
      "correctIndex": 2
    },
    {
      "id": "6a24bf66-dbf9-4e67-badb-ef89bc3a7170",
      "skill": "reading",
      "competency": "Comprensión lectora",
      "prompt": "\"Tom gets up at 7 and takes the bus to work.\" ¿Cómo va Tom al trabajo?",
      "options": [
        "En auto",
        "En bus",
        "Caminando",
        "En bicicleta"
      ],
      "correctIndex": 1
    },
    {
      "id": "b626596e-1faf-4501-9039-66ca131b1492",
      "skill": "reading",
      "competency": "Comprensión lectora",
      "prompt": "\"The library is open from Monday to Friday, but it closes early on Fridays.\" ¿Qué día cierra antes la biblioteca?",
      "options": [
        "Lunes",
        "Miércoles",
        "Viernes",
        "Sábado"
      ],
      "correctIndex": 2
    },
    {
      "id": "ab4b5de0-9491-41af-8c09-746464cacc68",
      "skill": "reading",
      "competency": "Comprensión lectora",
      "prompt": "\"Although the results were promising, the researchers warned that further studies were needed.\" ¿Qué opinan los investigadores?",
      "options": [
        "Que los resultados son definitivos",
        "Que se necesitan más estudios",
        "Que el estudio fracasó",
        "Que no hubo resultados"
      ],
      "correctIndex": 1
    },
    {
      "id": "c7eff2c3-d905-4aee-9336-e042a40e3615",
      "skill": "writing",
      "competency": "Gramática",
      "prompt": "Completa: \"She ___ a student.\"",
      "options": [
        "am",
        "is",
        "are",
        "be"
      ],
      "correctIndex": 1
    },
    {
      "id": "7a581686-7a83-4db6-a33e-37fde003e8f9",
      "skill": "writing",
      "competency": "Gramática",
      "prompt": "Selecciona la oración gramaticalmente correcta:",
      "options": [
        "She don't like coffee.",
        "She doesn't likes coffee.",
        "She doesn't like coffee.",
        "She not like coffee."
      ],
      "correctIndex": 2
    },
    {
      "id": "4d3ad722-6772-49aa-942b-c9e9bdd6ffd9",
      "skill": "writing",
      "competency": "Gramática",
      "prompt": "Completa: \"If I ___ more time, I would travel more.\"",
      "options": [
        "have",
        "had",
        "has",
        "having"
      ],
      "correctIndex": 1
    },
    {
      "id": "68557bfb-2e97-4578-9c0b-6215a8249a7e",
      "skill": "writing",
      "competency": "Gramática",
      "prompt": "Completa: \"By the time we arrived, the movie ___.\"",
      "options": [
        "already started",
        "has already started",
        "had already started",
        "was already start"
      ],
      "correctIndex": 2
    },
    {
      "id": "415aa494-75d1-4413-94da-b5d1d84d37e5",
      "skill": "writing",
      "competency": "Conectores",
      "prompt": "¿Cuál conector es más adecuado para contrastar dos ideas?",
      "options": [
        "Furthermore",
        "However",
        "Similarly",
        "Therefore"
      ],
      "correctIndex": 1
    },
    {
      "id": "a1a85d72-f532-475f-92ca-d887f7767149",
      "skill": "writing",
      "competency": "Conectores",
      "prompt": "Completa: \"___ having studied for weeks, he failed the exam.\"",
      "options": [
        "Although",
        "Despite",
        "However",
        "Because"
      ],
      "correctIndex": 1
    }
  ]
};

export const TESTS_SEMANALES: WeeklyTestContent[] = [
  {
    "id": "92c48768-3d99-41e2-865b-9d9d440bccbd",
    "title": "Everyday Vocabulary",
    "skill": "reading",
    "level": "A1",
    "questions": [
      {
        "id": "9f207156-1c80-44c8-8b19-4d45d899a7fd",
        "skill": "reading",
        "competency": "Vocabulario",
        "prompt": "¿Qué significa 'Monday'?",
        "options": [
          "Lunes",
          "Martes",
          "Domingo",
          "Mes"
        ],
        "correctIndex": 0
      },
      {
        "id": "92f3a356-5511-4895-abff-9bdf6b37a71a",
        "skill": "reading",
        "competency": "Vocabulario",
        "prompt": "Choose the opposite of 'big':",
        "options": [
          "Tall",
          "Small",
          "Long",
          "Fast"
        ],
        "correctIndex": 1
      },
      {
        "id": "799d64eb-05cc-40fb-9eee-73b00fbf9322",
        "skill": "reading",
        "competency": "Comprensión lectora",
        "prompt": "\"I have two brothers and one sister.\" ¿Cuántos hermanos y hermanas tiene en total?",
        "options": [
          "Dos",
          "Tres",
          "Cuatro",
          "Uno"
        ],
        "correctIndex": 1
      }
    ]
  },
  {
    "id": "1f6ade97-f2ab-4dad-8236-bed0561aa77d",
    "title": "Present Simple & Continuous",
    "skill": "writing",
    "level": "A2",
    "questions": [
      {
        "id": "bc29030c-08dc-471e-97ea-28ac61bee686",
        "skill": "writing",
        "competency": "Gramática",
        "prompt": "Completa: \"Right now, she ___ dinner.\"",
        "options": [
          "cooks",
          "is cooking",
          "cook",
          "cooked"
        ],
        "correctIndex": 1
      },
      {
        "id": "85ab0d7c-47ff-450b-8f18-eb592d1ba5df",
        "skill": "writing",
        "competency": "Gramática",
        "prompt": "Completa: \"They usually ___ to the gym on Mondays.\"",
        "options": [
          "goes",
          "are going",
          "go",
          "going"
        ],
        "correctIndex": 2
      },
      {
        "id": "3278a3ac-20d0-4727-8575-0d63c56f640b",
        "skill": "writing",
        "competency": "Gramática",
        "prompt": "Selecciona la oración correcta:",
        "options": [
          "He is play football now.",
          "He plays football every Sunday.",
          "He playing football every Sunday.",
          "He play football now."
        ],
        "correctIndex": 1
      }
    ]
  },
  {
    "id": "71c8e04d-f745-4129-b8d8-e049b9d48a88",
    "title": "Skimming & Scanning",
    "skill": "reading",
    "level": "B1",
    "questions": [
      {
        "id": "6eb04825-4d84-428f-88ec-438a398266e7",
        "skill": "reading",
        "competency": "Comprensión lectora",
        "prompt": "\"Our new app helps students organize their study time and track their progress.\" ¿Cuál es el propósito principal del texto?",
        "options": [
          "Entretener",
          "Informar sobre una app",
          "Criticar a los estudiantes",
          "Narrar una historia"
        ],
        "correctIndex": 1
      },
      {
        "id": "398614bf-b810-42a7-9954-fe7de9296be7",
        "skill": "reading",
        "competency": "Comprensión lectora",
        "prompt": "Hacer skimming de un texto significa:",
        "options": [
          "Leer cada palabra con cuidado",
          "Leer rápido para captar la idea general",
          "Buscar un dato específico",
          "Traducir el texto"
        ],
        "correctIndex": 1
      },
      {
        "id": "3f792900-6f64-4971-ac28-9a46506d3a1a",
        "skill": "reading",
        "competency": "Comprensión lectora",
        "prompt": "El scanning se usa para:",
        "options": [
          "Encontrar un dato específico, como una fecha",
          "Resumir el texto",
          "Leer por placer",
          "Corregir la gramática"
        ],
        "correctIndex": 0
      }
    ]
  },
  {
    "id": "56b5b41a-3a13-4975-9735-c33e2c0c0181",
    "title": "Conditionals I",
    "skill": "writing",
    "level": "B1",
    "questions": [
      {
        "id": "7a861c76-f278-4b48-b77f-b4a2df90af03",
        "skill": "writing",
        "competency": "Gramática",
        "prompt": "Completa: \"If it rains, we ___ at home.\"",
        "options": [
          "stay",
          "will stay",
          "would stay",
          "stayed"
        ],
        "correctIndex": 1
      },
      {
        "id": "ffc0d00d-6766-4e2d-a8a1-beabf6d5fbdd",
        "skill": "writing",
        "competency": "Gramática",
        "prompt": "Completa: \"If I ___ you, I would study more.\"",
        "options": [
          "am",
          "was",
          "were",
          "be"
        ],
        "correctIndex": 2
      },
      {
        "id": "390adfab-55c1-4a3a-83db-31909fc2c1cf",
        "skill": "writing",
        "competency": "Gramática",
        "prompt": "¿Qué tipo de condicional es \"If you heat ice, it melts\"?",
        "options": [
          "Zero conditional",
          "First conditional",
          "Second conditional",
          "Third conditional"
        ],
        "correctIndex": 0
      }
    ]
  },
  {
    "id": "c8767b1d-f24f-4fca-bff0-227df5790231",
    "title": "Connectors for Contrast",
    "skill": "writing",
    "level": "B2",
    "questions": [
      {
        "id": "844313e3-ccbd-4b2b-a08e-5ac269a7614c",
        "skill": "writing",
        "competency": "Conectores",
        "prompt": "Completa: \"___ it was raining, we went for a walk.\"",
        "options": [
          "Although",
          "Despite",
          "However",
          "Therefore"
        ],
        "correctIndex": 0
      },
      {
        "id": "c1873545-bdc3-4f0e-b310-3a1b86d88514",
        "skill": "writing",
        "competency": "Conectores",
        "prompt": "Completa: \"The plan was good. ___, it was too expensive.\"",
        "options": [
          "Moreover",
          "However",
          "Because",
          "So"
        ],
        "correctIndex": 1
      },
      {
        "id": "f21dd824-6af8-4994-81a3-2b0f13885010",
        "skill": "writing",
        "competency": "Conectores",
        "prompt": "Completa: \"___ the traffic, we arrived on time.\"",
        "options": [
          "Although",
          "In spite of",
          "Even though",
          "However"
        ],
        "correctIndex": 1
      }
    ]
  },
  {
    "id": "00b71411-7d96-4954-87f9-90a0303059af",
    "title": "Academic Reading",
    "skill": "reading",
    "level": "C1",
    "questions": [
      {
        "id": "350bb14a-9972-4433-9437-ab6a745195cc",
        "skill": "reading",
        "competency": "Vocabulario",
        "prompt": "\"The findings corroborate previous research.\" 'Corroborate' significa:",
        "options": [
          "Contradecir",
          "Confirmar",
          "Ignorar",
          "Resumir"
        ],
        "correctIndex": 1
      },
      {
        "id": "0acc1b67-c0c3-433c-b18a-35693c0dff43",
        "skill": "reading",
        "competency": "Conectores",
        "prompt": "\"Notwithstanding the budget cuts, the project was completed.\" ¿Qué indica 'notwithstanding'?",
        "options": [
          "Causa",
          "Contraste",
          "Consecuencia",
          "Ejemplo"
        ],
        "correctIndex": 1
      },
      {
        "id": "49e79285-d41f-424b-81e6-230065d9c369",
        "skill": "reading",
        "competency": "Comprensión lectora",
        "prompt": "\"The author's argument hinges on the reliability of the data.\" ¿De qué depende el argumento?",
        "options": [
          "Del estilo del autor",
          "De la confiabilidad de los datos",
          "De la cantidad de lectores",
          "Del presupuesto"
        ],
        "correctIndex": 1
      }
    ]
  }
];
