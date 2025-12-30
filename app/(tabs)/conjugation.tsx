import { useState, useCallback, useMemo } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useSpeech } from "@/hooks/use-speech";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { cn } from "@/lib/utils";

// Difficulty levels
type DifficultyLevel = "beginner" | "intermediate" | "advanced";

// Verb conjugation data
interface VerbData {
  infinitive: string;
  english: string;
  group: 1 | 2 | 3;
  irregular?: boolean;
  difficulty: DifficultyLevel;
  conjugations: {
    present: string[];
    passéComposé?: string[];
    imparfait?: string[];
    futurSimple?: string[];
  };
}

// Pronouns for display
const PRONOUNS = ["je", "tu", "il/elle", "nous", "vous", "ils/elles"];

const VERBS_DATA: VerbData[] = [
  // Beginner Level - Regular ER verbs
  {
    infinitive: "manger",
    english: "to eat",
    group: 1,
    difficulty: "beginner",
    conjugations: {
      present: ["mange", "manges", "mange", "mangeons", "mangez", "mangent"],
    },
  },
  {
    infinitive: "parler",
    english: "to speak",
    group: 1,
    difficulty: "beginner",
    conjugations: {
      present: ["parle", "parles", "parle", "parlons", "parlez", "parlent"],
    },
  },
  {
    infinitive: "habiter",
    english: "to live",
    group: 1,
    difficulty: "beginner",
    conjugations: {
      present: ["habite", "habites", "habite", "habitons", "habitez", "habitent"],
    },
  },
  {
    infinitive: "aimer",
    english: "to love/like",
    group: 1,
    difficulty: "beginner",
    conjugations: {
      present: ["aime", "aimes", "aime", "aimons", "aimez", "aiment"],
    },
  },
  {
    infinitive: "jouer",
    english: "to play",
    group: 1,
    difficulty: "beginner",
    conjugations: {
      present: ["joue", "joues", "joue", "jouons", "jouez", "jouent"],
    },
  },

  // Beginner Level - Basic irregulars (être, avoir, aller, faire, venir)
  {
    infinitive: "être",
    english: "to be",
    group: 3,
    irregular: true,
    difficulty: "beginner",
    conjugations: {
      present: ["suis", "es", "est", "sommes", "êtes", "sont"],
    },
  },
  {
    infinitive: "avoir",
    english: "to have",
    group: 3,
    irregular: true,
    difficulty: "beginner",
    conjugations: {
      present: ["ai", "as", "a", "avons", "avez", "ont"],
    },
  },
  {
    infinitive: "aller",
    english: "to go",
    group: 3,
    irregular: true,
    difficulty: "beginner",
    conjugations: {
      present: ["vais", "vas", "va", "allons", "allez", "vont"],
    },
  },
  {
    infinitive: "faire",
    english: "to do/make",
    group: 3,
    irregular: true,
    difficulty: "beginner",
    conjugations: {
      present: ["fais", "fais", "fait", "faisons", "faites", "font"],
    },
  },
  {
    infinitive: "venir",
    english: "to come",
    group: 3,
    irregular: true,
    difficulty: "beginner",
    conjugations: {
      present: ["viens", "viens", "vient", "venons", "venez", "viennent"],
    },
  },

  // Intermediate Level - All regular verbs
  {
    infinitive: "finir",
    english: "to finish",
    group: 2,
    difficulty: "intermediate",
    conjugations: {
      present: ["finis", "finis", "finit", "finissons", "finissez", "finissent"],
      passéComposé: ["ai fini", "as fini", "a fini", "avons fini", "avez fini", "ont fini"],
      imparfait: ["finissais", "finissais", "finissait", "finissions", "finissiez", "finissaient"],
      futurSimple: ["finirai", "finiras", "finira", "finirons", "finirez", "finiront"],
    },
  },
  {
    infinitive: "vendre",
    english: "to sell",
    group: 3,
    difficulty: "intermediate",
    conjugations: {
      present: ["vends", "vends", "vend", "vendons", "vendez", "vendent"],
      passéComposé: ["ai vendu", "as vendu", "a vendu", "avons vendu", "avez vendu", "ont vendu"],
      imparfait: ["vendais", "vendais", "vendait", "vendions", "vendiez", "vendaient"],
      futurSimple: ["vendrai", "vendras", "vendra", "vendrons", "vendrez", "vendront"],
    },
  },
  {
    infinitive: "prendre",
    english: "to take",
    group: 3,
    irregular: true,
    difficulty: "intermediate",
    conjugations: {
      present: ["prends", "prends", "prend", "prenons", "prenez", "prennent"],
      passéComposé: ["ai pris", "as pris", "a pris", "avons pris", "avez pris", "ont pris"],
      imparfait: ["prenais", "prenais", "prenait", "prenions", "preniez", "prenaient"],
      futurSimple: ["prendrai", "prendras", "prendra", "prendrons", "prendrez", "prendront"],
    },
  },
  {
    infinitive: "boire",
    english: "to drink",
    group: 3,
    irregular: true,
    difficulty: "intermediate",
    conjugations: {
      present: ["bois", "bois", "boit", "buvons", "buvez", "boivent"],
      passéComposé: ["ai bu", "as bu", "a bu", "avons bu", "avez bu", "ont bu"],
      imparfait: ["buvais", "buvais", "buvait", "buvions", "buviez", "buvaient"],
      futurSimple: ["boirai", "boiras", "boira", "boirons", "boirez", "boiront"],
    },
  },
  {
    infinitive: "voir",
    english: "to see",
    group: 3,
    irregular: true,
    difficulty: "intermediate",
    conjugations: {
      present: ["vois", "vois", "voit", "voyons", "voyez", "voient"],
      passéComposé: ["ai vu", "as vu", "a vu", "avons vu", "avez vu", "ont vu"],
      imparfait: ["voyais", "voyais", "voyait", "voyions", "voyiez", "voyaient"],
      futurSimple: ["verrai", "verras", "verra", "verrons", "verrez", "verront"],
    },
  },

  // Advanced Level - Complex irregulars
  {
    infinitive: "pouvoir",
    english: "to be able to/can",
    group: 3,
    irregular: true,
    difficulty: "advanced",
    conjugations: {
      present: ["peux", "peux", "peut", "pouvons", "pouvez", "peuvent"],
      passéComposé: ["ai pu", "as pu", "a pu", "avons pu", "avez pu", "ont pu"],
      imparfait: ["pouvais", "pouvais", "pouvait", "pouvions", "pouviez", "pouvaient"],
      futurSimple: ["pourrai", "pourras", "pourra", "pourrons", "pourrez", "pourront"],
    },
  },
  {
    infinitive: "vouloir",
    english: "to want",
    group: 3,
    irregular: true,
    difficulty: "advanced",
    conjugations: {
      present: ["veux", "veux", "veut", "voulons", "voulez", "veulent"],
      passéComposé: ["ai voulu", "as voulu", "a voulu", "avons voulu", "avez voulu", "ont voulu"],
      imparfait: ["voulais", "voulais", "voulait", "voulions", "vouliez", "voulaient"],
      futurSimple: ["voudrai", "voudras", "voudra", "voudrons", "voudrez", "voudront"],
    },
  },
  {
    infinitive: "savoir",
    english: "to know",
    group: 3,
    irregular: true,
    difficulty: "advanced",
    conjugations: {
      present: ["sais", "sais", "sait", "savons", "savez", "savent"],
      passéComposé: ["ai su", "as su", "a su", "avons su", "avez su", "ont su"],
      imparfait: ["savais", "savais", "savait", "savions", "saviez", "savaient"],
      futurSimple: ["saurai", "sauras", "saura", "saurons", "saurez", "sauront"],
    },
  },
];

export default function ConjugationScreen() {
  const [selectedDifficulty, setSelectedDifficulty] = useState<DifficultyLevel>("beginner");
  const [currentVerb, setCurrentVerb] = useState<VerbData | null>(null);
  const [currentPronounIndex, setCurrentPronounIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState("");
  const [showMultipleChoice, setShowMultipleChoice] = useState(false);
  const [multipleChoiceOptions, setMultipleChoiceOptions] = useState<string[]>([]);
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [showTip, setShowTip] = useState(false);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [currentFullSentence, setCurrentFullSentence] = useState<string>("");
  const [currentDisplaySentence, setCurrentDisplaySentence] = useState<string>("");

  const { speak } = useSpeech();

  // Filter verbs by difficulty
  const availableVerbs = useMemo(() => {
    return VERBS_DATA.filter(verb => verb.difficulty === selectedDifficulty);
  }, [selectedDifficulty]);

  // Generate multiple choice options
  const generateMultipleChoice = useCallback((correctAnswer: string, allConjugations: string[]) => {
    const options = [correctAnswer];
    const otherOptions = allConjugations.filter(conj => conj !== correctAnswer);

    // Add 3 random incorrect options
    while (options.length < 4 && otherOptions.length > 0) {
      const randomIndex = Math.floor(Math.random() * otherOptions.length);
      const option = otherOptions.splice(randomIndex, 1)[0];
      if (!options.includes(option)) {
        options.push(option);
      }
    }

    // Shuffle options
    return options.sort(() => Math.random() - 0.5);
  }, []);

  // Generate complete French sentences for verbs
  const generateCompleteSentence = useCallback((verb: VerbData, pronounIndex: number): string => {
    const pronoun = PRONOUNS[pronounIndex];
    const conjugation = verb.conjugations.present[pronounIndex];

    // Sentence templates for different verbs to create natural French sentences
    const sentenceTemplates: Record<string, string[]> = {
      // Food/eating verbs
      "manger": [
        `${pronoun} ${conjugation} une pomme.`,
        `${pronoun} ${conjugation} du pain.`,
        `${pronoun} ${conjugation} des légumes.`,
        `${pronoun} ${conjugation} au restaurant.`,
        `${pronoun} ${conjugation} avec plaisir.`,
        `${pronoun} ${conjugation} trop vite.`
      ],
      "boire": [
        `${pronoun} ${conjugation} de l'eau.`,
        `${pronoun} ${conjugation} du café.`,
        `${pronoun} ${conjugation} du jus d'orange.`,
        `${pronoun} ${conjugation} lentement.`,
        `${pronoun} ${conjugation} à la santé de quelqu'un.`,
        `${pronoun} ${conjugation} dans un verre.`
      ],
      // Movement verbs
      "aller": [
        `${pronoun} ${conjugation} à l'école.`,
        `${pronoun} ${conjugation} au cinéma.`,
        `${pronoun} ${conjugation} en ville.`,
        `${pronoun} ${conjugation} chez des amis.`,
        `${pronoun} ${conjugation} se promener.`,
        `${pronoun} ${conjugation} faire les courses.`
      ],
      "venir": [
        `${pronoun} ${conjugation} de Paris.`,
        `${pronoun} ${conjugation} à la fête.`,
        `${pronoun} ${conjugation} me voir.`,
        `${pronoun} ${conjugation} d'Italie.`,
        `${pronoun} ${conjugation} nous aider.`,
        `${pronoun} ${conjugation} avec nous.`
      ],
      // Action verbs
      "parler": [
        `${pronoun} ${conjugation} français.`,
        `${pronoun} ${conjugation} anglais.`,
        `${pronoun} ${conjugation} avec ses amis.`,
        `${pronoun} ${conjugation} de voyages.`,
        `${pronoun} ${conjugation} au téléphone.`,
        `${pronoun} ${conjugation} trop fort.`
      ],
      "habiter": [
        `${pronoun} ${conjugation} à Paris.`,
        `${pronoun} ${conjugation} dans un appartement.`,
        `${pronoun} ${conjugation} près de l'école.`,
        `${pronoun} ${conjugation} avec sa famille.`,
        `${pronoun} ${conjugation} au centre-ville.`,
        `${pronoun} ${conjugation} depuis longtemps.`
      ],
      "aimer": [
        `${pronoun} ${conjugation} la musique.`,
        `${pronoun} ${conjugation} voyager.`,
        `${pronoun} ${conjugation} ses amis.`,
        `${pronoun} ${conjugation} beaucoup.`,
        `${pronoun} ${conjugation} le chocolat.`,
        `${pronoun} ${conjugation} faire du sport.`
      ],
      "finir": [
        `${pronoun} ${conjugation} ses devoirs.`,
        `${pronoun} ${conjugation} le travail.`,
        `${pronoun} ${conjugation} tard.`,
        `${pronoun} ${conjugation} bientôt.`,
        `${pronoun} ${conjugation} à temps.`,
        `${pronoun} ${conjugation} toujours en retard.`
      ],
      "prendre": [
        `${pronoun} ${conjugation} le bus.`,
        `${pronoun} ${conjugation} une douche.`,
        `${pronoun} ${conjugation} le petit-déjeuner.`,
        `${pronoun} ${conjugation} des photos.`,
        `${pronoun} ${conjugation} du temps.`,
        `${pronoun} ${conjugation} rendez-vous.`
      ],
      "voir": [
        `${pronoun} ${conjugation} un film.`,
        `${pronoun} ${conjugation} ses amis.`,
        `${pronoun} ${conjugation} la télé.`,
        `${pronoun} ${conjugation} bien.`,
        `${pronoun} ${conjugation} souvent.`,
        `${pronoun} ${conjugation} des étoiles.`
      ],
      "travailler": [
        `${pronoun} ${conjugation} dur.`,
        `${pronoun} ${conjugation} à l'ordinateur.`,
        `${pronoun} ${conjugation} dans un bureau.`,
        `${pronoun} ${conjugation} tous les jours.`,
        `${pronoun} ${conjugation} beaucoup.`,
        `${pronoun} ${conjugation} la nuit.`
      ],
      "jouer": [
        `${pronoun} ${conjugation} au football.`,
        `${pronoun} ${conjugation} du piano.`,
        `${pronoun} ${conjugation} aux jeux vidéo.`,
        `${pronoun} ${conjugation} dehors.`,
        `${pronoun} ${conjugation} avec des amis.`,
        `${pronoun} ${conjugation} bien.`
      ],
      // Learning verbs
      "apprendre": [
        `${pronoun} ${conjugation} le français.`,
        `${pronoun} ${conjugation} à nager.`,
        `${pronoun} ${conjugation} par cœur.`,
        `${pronoun} ${conjugation} vite.`,
        `${pronoun} ${conjugation} l'anglais.`,
        `${pronoun} ${conjugation} facilement.`
      ],
      "lire": [
        `${pronoun} ${conjugation} un livre.`,
        `${pronoun} ${conjugation} le journal.`,
        `${pronoun} ${conjugation} des romans.`,
        `${pronoun} ${conjugation} lentement.`,
        `${pronoun} ${conjugation} en français.`,
        `${pronoun} ${conjugation} tous les jours.`
      ],
      "écrire": [
        `${pronoun} ${conjugation} une lettre.`,
        `${pronoun} ${conjugation} des emails.`,
        `${pronoun} ${conjugation} un roman.`,
        `${pronoun} ${conjugation} au tableau.`,
        `${pronoun} ${conjugation} bien.`,
        `${pronoun} ${conjugation} vite.`
      ],
      // State verbs
      "être": [
        `${pronoun} ${conjugation} heureux.`,
        `${pronoun} ${conjugation} fatigué.`,
        `${pronoun} ${conjugation} à la maison.`,
        `${pronoun} ${conjugation} content.`,
        `${pronoun} ${conjugation} malade.`,
        `${pronoun} ${conjugation} en retard.`
      ],
      "avoir": [
        `${pronoun} ${conjugation} faim.`,
        `${pronoun} ${conjugation} froid.`,
        `${pronoun} ${conjugation} raison.`,
        `${pronoun} ${conjugation} sommeil.`,
        `${pronoun} ${conjugation} peur.`,
        `${pronoun} ${conjugation} besoin d'aide.`
      ],
      // Default templates for other verbs
      "default": [
        `${pronoun} ${conjugation} souvent.`,
        `${pronoun} ${conjugation} bien.`,
        `${pronoun} ${conjugation} ici.`,
        `${pronoun} ${conjugation} maintenant.`,
        `${pronoun} ${conjugation} toujours.`,
        `${pronoun} ${conjugation} beaucoup.`
      ]
    };

    // Get sentences for this verb, or use default
    const sentences = sentenceTemplates[verb.infinitive] || sentenceTemplates["default"];

    // Return a random sentence for variety
    return sentences[Math.floor(Math.random() * sentences.length)];
  }, []);

  // Generate display sentence with blank for the verb
  const generateDisplaySentence = useCallback((verb: VerbData, pronounIndex: number): string => {
    const pronoun = PRONOUNS[pronounIndex];

    // Use the same sentence template as complete sentence but replace conjugation with "__"
    const completeSentence = generateCompleteSentence(verb, pronounIndex);
    const conjugation = verb.conjugations.present[pronounIndex];

    // Replace the conjugated verb with "__" in the sentence
    return completeSentence.replace(conjugation, '__');
  }, [generateCompleteSentence]);

  // Generate complete French sentences for verbs
  const generateCompleteSentence = useCallback((verb: VerbData, pronounIndex: number): string => {
    const pronoun = PRONOUNS[pronounIndex];
    const conjugation = verb.conjugations.present[pronounIndex];

    // Sentence templates for different verbs to create natural French sentences
    const sentenceTemplates: Record<string, string[]> = {
      // Food/eating verbs
      "manger": [
        `${pronoun} ${conjugation} une pomme.`,
        `${pronoun} ${conjugation} du pain.`,
        `${pronoun} ${conjugation} des légumes.`,
        `${pronoun} ${conjugation} au restaurant.`,
        `${pronoun} ${conjugation} avec plaisir.`,
        `${pronoun} ${conjugation} trop vite.`
      ],
      "boire": [
        `${pronoun} ${conjugation} de l'eau.`,
        `${pronoun} ${conjugation} du café.`,
        `${pronoun} ${conjugation} du jus d'orange.`,
        `${pronoun} ${conjugation} lentement.`,
        `${pronoun} ${conjugation} à la santé de quelqu'un.`,
        `${pronoun} ${conjugation} dans un verre.`
      ],
      // Movement verbs
      "aller": [
        `${pronoun} ${conjugation} à l'école.`,
        `${pronoun} ${conjugation} au cinéma.`,
        `${pronoun} ${conjugation} en ville.`,
        `${pronoun} ${conjugation} chez des amis.`,
        `${pronoun} ${conjugation} se promener.`,
        `${pronoun} ${conjugation} faire les courses.`
      ],
      "venir": [
        `${pronoun} ${conjugation} de Paris.`,
        `${pronoun} ${conjugation} à la fête.`,
        `${pronoun} ${conjugation} me voir.`,
        `${pronoun} ${conjugation} d'Italie.`,
        `${pronoun} ${conjugation} nous aider.`,
        `${pronoun} ${conjugation} avec nous.`
      ],
      // Action verbs
      "parler": [
        `${pronoun} ${conjugation} français.`,
        `${pronoun} ${conjugation} anglais.`,
        `${pronoun} ${conjugation} avec ses amis.`,
        `${pronoun} ${conjugation} de voyages.`,
        `${pronoun} ${conjugation} au téléphone.`,
        `${pronoun} ${conjugation} trop fort.`
      ],
      "habiter": [
        `${pronoun} ${conjugation} à Paris.`,
        `${pronoun} ${conjugation} dans un appartement.`,
        `${pronoun} ${conjugation} près de l'école.`,
        `${pronoun} ${conjugation} avec sa famille.`,
        `${pronoun} ${conjugation} au centre-ville.`,
        `${pronoun} ${conjugation} depuis longtemps.`
      ],
      "aimer": [
        `${pronoun} ${conjugation} la musique.`,
        `${pronoun} ${conjugation} voyager.`,
        `${pronoun} ${conjugation} ses amis.`,
        `${pronoun} ${conjugation} beaucoup.`,
        `${pronoun} ${conjugation} le chocolat.`,
        `${pronoun} ${conjugation} faire du sport.`
      ],
      "finir": [
        `${pronoun} ${conjugation} ses devoirs.`,
        `${pronoun} ${conjugation} le travail.`,
        `${pronoun} ${conjugation} tard.`,
        `${pronoun} ${conjugation} bientôt.`,
        `${pronoun} ${conjugation} à temps.`,
        `${pronoun} ${conjugation} toujours en retard.`
      ],
      "prendre": [
        `${pronoun} ${conjugation} le bus.`,
        `${pronoun} ${conjugation} une douche.`,
        `${pronoun} ${conjugation} le petit-déjeuner.`,
        `${pronoun} ${conjugation} des photos.`,
        `${pronoun} ${conjugation} du temps.`,
        `${pronoun} ${conjugation} rendez-vous.`
      ],
      "voir": [
        `${pronoun} ${conjugation} un film.`,
        `${pronoun} ${conjugation} ses amis.`,
        `${pronoun} ${conjugation} la télé.`,
        `${pronoun} ${conjugation} bien.`,
        `${pronoun} ${conjugation} souvent.`,
        `${pronoun} ${conjugation} des étoiles.`
      ],
      "travailler": [
        `${pronoun} ${conjugation} dur.`,
        `${pronoun} ${conjugation} à l'ordinateur.`,
        `${pronoun} ${conjugation} dans un bureau.`,
        `${pronoun} ${conjugation} tous les jours.`,
        `${pronoun} ${conjugation} beaucoup.`,
        `${pronoun} ${conjugation} la nuit.`
      ],
      "jouer": [
        `${pronoun} ${conjugation} au football.`,
        `${pronoun} ${conjugation} du piano.`,
        `${pronoun} ${conjugation} aux jeux vidéo.`,
        `${pronoun} ${conjugation} dehors.`,
        `${pronoun} ${conjugation} avec des amis.`,
        `${pronoun} ${conjugation} bien.`
      ],
      // Learning verbs
      "apprendre": [
        `${pronoun} ${conjugation} le français.`,
        `${pronoun} ${conjugation} à nager.`,
        `${pronoun} ${conjugation} par cœur.`,
        `${pronoun} ${conjugation} vite.`,
        `${pronoun} ${conjugation} l'anglais.`,
        `${pronoun} ${conjugation} facilement.`
      ],
      "lire": [
        `${pronoun} ${conjugation} un livre.`,
        `${pronoun} ${conjugation} le journal.`,
        `${pronoun} ${conjugation} des romans.`,
        `${pronoun} ${conjugation} lentement.`,
        `${pronoun} ${conjugation} en français.`,
        `${pronoun} ${conjugation} tous les jours.`
      ],
      "écrire": [
        `${pronoun} ${conjugation} une lettre.`,
        `${pronoun} ${conjugation} des emails.`,
        `${pronoun} ${conjugation} un roman.`,
        `${pronoun} ${conjugation} au tableau.`,
        `${pronoun} ${conjugation} bien.`,
        `${pronoun} ${conjugation} vite.`
      ],
      // State verbs
      "être": [
        `${pronoun} ${conjugation} heureux.`,
        `${pronoun} ${conjugation} fatigué.`,
        `${pronoun} ${conjugation} à la maison.`,
        `${pronoun} ${conjugation} content.`,
        `${pronoun} ${conjugation} malade.`,
        `${pronoun} ${conjugation} en retard.`
      ],
      "avoir": [
        `${pronoun} ${conjugation} faim.`,
        `${pronoun} ${conjugation} froid.`,
        `${pronoun} ${conjugation} raison.`,
        `${pronoun} ${conjugation} sommeil.`,
        `${pronoun} ${conjugation} peur.`,
        `${pronoun} ${conjugation} besoin d'aide.`
      ],
      // Default templates for other verbs
      "default": [
        `${pronoun} ${conjugation} souvent.`,
        `${pronoun} ${conjugation} bien.`,
        `${pronoun} ${conjugation} ici.`,
        `${pronoun} ${conjugation} maintenant.`,
        `${pronoun} ${conjugation} toujours.`,
        `${pronoun} ${conjugation} beaucoup.`
      ]
    };

    // Get sentences for this verb, or use default
    const sentences = sentenceTemplates[verb.infinitive] || sentenceTemplates["default"];

    // Return a random sentence for variety
    return sentences[Math.floor(Math.random() * sentences.length)];
  }, []);

  // Start new conjugation exercise
  const startNewExercise = useCallback(() => {
    if (availableVerbs.length === 0) return;

    const randomVerb = availableVerbs[Math.floor(Math.random() * availableVerbs.length)];
    const randomPronoun = Math.floor(Math.random() * PRONOUNS.length);

    setCurrentVerb(randomVerb);
    setCurrentPronounIndex(randomPronoun);
    setUserAnswer("");
    setShowResult(false);
    setShowTip(false);

    // Generate and show the complete sentence immediately
    const completeSentence = generateCompleteSentence(randomVerb, randomPronoun);
    setCurrentFullSentence(completeSentence);

    // Generate display sentence with blank for the verb
    const displaySentence = generateDisplaySentence(randomVerb, randomPronoun);
    setCurrentDisplaySentence(displaySentence);

    // Generate multiple choice options
    const correctAnswer = randomVerb.conjugations.present[randomPronoun];
    const allConjugations = randomVerb.conjugations.present;
    setMultipleChoiceOptions(generateMultipleChoice(correctAnswer, allConjugations));
    setShowMultipleChoice(true);
  }, [availableVerbs, generateMultipleChoice, generateCompleteSentence, generateDisplaySentence]);

  // Check answer
  const checkAnswer = useCallback((answer: string) => {
    if (!currentVerb) return;

    const correctAnswer = currentVerb.conjugations.present[currentPronounIndex];
    const correct = answer === correctAnswer;

    setIsCorrect(correct);
    setShowResult(true);
    setShowMultipleChoice(false);

    if (correct) {
      setScore(prev => prev + 10);
      setStreak(prev => prev + 1);
    } else {
      setStreak(0);
    }
  }, [currentVerb, currentPronounIndex]);

  // Get tip for current verb
  const getTip = useCallback(() => {
    if (!currentVerb) return "";

    const tips = {
      1: "ER verbs: Remove -er and add endings: -e, -es, -e, -ons, -ez, -ent",
      2: "IR verbs: Remove -ir and add endings: -is, -is, -it, -issons, -issez, -issent",
      3: "RE verbs: Remove -re and add endings: -s, -s, -t, -ons, -ez, -ent",
    };

    return tips[currentVerb.group] || "Check the verb group and apply the correct endings.";
  }, [currentVerb]);

  // Speak the current sentence being displayed
  const speakCorrectSentence = useCallback(() => {
    if (currentFullSentence) {
      speak(currentFullSentence);
    }
  }, [currentFullSentence, speak]);

  // Initialize first exercise
  useState(() => {
    startNewExercise();
  });

  if (availableVerbs.length === 0) {
    return (
      <ScreenContainer className="items-center justify-center">
        <Text className="text-xl text-foreground text-center">
          No verbs available for this difficulty level.
        </Text>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer className="p-4">
      {/* Header */}
      <View className="flex-row justify-between items-center mb-6">
        <Text className="text-2xl font-bold text-primary">Conjugation Game</Text>
        <View className="flex-row items-center gap-2">
          <Text className="text-sm text-muted">Score: {score}</Text>
          <Text className="text-sm text-muted">🔥 {streak}</Text>
        </View>
      </View>

      {/* Difficulty Selector */}
      <View className="flex-row gap-2 mb-6">
        {(["beginner", "intermediate", "advanced"] as DifficultyLevel[]).map((level) => (
          <Pressable
            key={level}
            onPress={() => setSelectedDifficulty(level)}
            style={({ pressed }) => [
              styles.difficultyButton,
              selectedDifficulty === level && styles.activeDifficultyButton,
              pressed && styles.pressedButton,
            ]}
          >
            <Text
              style={[
                styles.difficultyButtonText,
                selectedDifficulty === level && styles.activeDifficultyButtonText,
              ]}
            >
              {level.charAt(0).toUpperCase() + level.slice(1)}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Verb Information */}
      {currentVerb && (
        <View className="bg-surface rounded-2xl p-6 mb-6 border border-border">
          <View className="items-center mb-4">
            <Text className="text-2xl font-bold text-primary mb-1">
              {currentVerb.infinitive}
            </Text>
            <Text className="text-lg text-muted mb-2">
              {currentVerb.english}
            </Text>
            <View className="flex-row items-center gap-2">
              <Text className="text-sm bg-muted px-2 py-1 rounded">
                Group {currentVerb.group}
              </Text>
              {currentVerb.irregular && (
                <Text className="text-sm bg-warning/20 px-2 py-1 rounded text-warning">
                  Irregular
                </Text>
              )}
            </View>
          </View>

          {/* Exercise */}
          <View className="items-center">
            <Text className="text-xl text-foreground mb-4">
              {currentDisplaySentence.split(' ').map((word, index) => {
                // Highlight the pronoun that needs conjugation
                const isTargetPronoun = index === 0 && PRONOUNS.includes(word.toLowerCase());
                // Highlight the blank (__) with special styling
                const isBlank = word === '__';
                return isTargetPronoun ? (
                  <Text key={index} className="font-bold text-primary underline">
                    {word}{' '}
                  </Text>
                ) : isBlank ? (
                  <Text key={index} className="font-bold text-secondary bg-secondary/20 px-2 py-1 rounded border-2 border-dashed border-secondary">
                    {word}{' '}
                  </Text>
                ) : (
                  <Text key={index}>{word}{' '}</Text>
                );
              })}
            </Text>

            {/* Multiple Choice */}
            {showMultipleChoice && !showResult && (
              <View className="w-full gap-3">
                {multipleChoiceOptions.map((option, index) => (
                  <Pressable
                    key={index}
                    onPress={() => checkAnswer(option)}
                    style={({ pressed }) => [
                      styles.choiceButton,
                      pressed && styles.pressedButton,
                    ]}
                  >
                    <Text style={styles.choiceButtonText}>{option}</Text>
                  </Pressable>
                ))}
              </View>
            )}

            {/* Result */}
            {showResult && (
              <View className="items-center w-full">
                <View className={cn(
                  "px-6 py-3 rounded-xl mb-4",
                  isCorrect ? "bg-success/20" : "bg-error/20"
                )}>
                  <Text className={cn(
                    "text-lg font-semibold",
                    isCorrect ? "text-success" : "text-error"
                  )}>
                    {isCorrect ? "Correct! ✓" : "Incorrect ✗"}
                  </Text>
                </View>

                {!isCorrect && (
                  <Text className="text-base text-foreground mb-4">
                    Correct answer: <Text className="font-bold text-primary">
                      {currentVerb.conjugations.present[currentPronounIndex]}
                    </Text>
                  </Text>
                )}

                <View className="flex-row gap-3">
                  <Pressable
                    onPress={speakCorrectSentence}
                    style={({ pressed }) => [
                      styles.actionButton,
                      pressed && styles.pressedButton,
                    ]}
                  >
                    <MaterialIcons name="volume-up" size={20} color="#0055A4" />
                    <Text style={styles.actionButtonText}>Listen</Text>
                  </Pressable>

                  <Pressable
                    onPress={() => setShowTip(!showTip)}
                    style={({ pressed }) => [
                      styles.actionButton,
                      pressed && styles.pressedButton,
                    ]}
                  >
                    <MaterialIcons name="lightbulb" size={20} color="#F59E0B" />
                    <Text style={styles.actionButtonText}>Tip</Text>
                  </Pressable>
                </View>

                {showTip && (
                  <View className="mt-4 p-3 bg-muted rounded-lg w-full">
                    <Text className="text-sm text-foreground text-center">
                      {getTip()}
                    </Text>
                  </View>
                )}
              </View>
            )}
          </View>
        </View>
      )}

      {/* Next Button */}
      {showResult && (
        <Pressable
          onPress={startNewExercise}
          style={({ pressed }) => [
            styles.nextButton,
            pressed && styles.pressedButton,
          ]}
        >
          <Text style={styles.nextButtonText}>Next Verb</Text>
          <MaterialIcons name="arrow-forward" size={20} color="white" />
        </Pressable>
      )}

      {/* Instructions */}
      {!showResult && (
        <View className="bg-muted/50 rounded-xl p-4">
          <Text className="text-sm text-muted text-center">
            Listen to the sentence and choose the correct conjugation for the highlighted pronoun.
          </Text>
        </View>
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  difficultyButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: "rgba(107, 114, 128, 0.1)",
    alignItems: "center",
  },
  activeDifficultyButton: {
    backgroundColor: "#0055A4",
  },
  pressedButton: {
    opacity: 0.7,
    transform: [{ scale: 0.98 }],
  },
  difficultyButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#6B7280",
  },
  activeDifficultyButtonText: {
    color: "white",
  },
  choiceButton: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    backgroundColor: "rgba(107, 114, 128, 0.1)",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(107, 114, 128, 0.2)",
  },
  choiceButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1F2937",
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: "rgba(107, 114, 128, 0.1)",
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#4B5563",
  },
  nextButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 16,
    backgroundColor: "#0055A4",
    marginTop: 20,
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "white",
  },
});
