import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Trophy,
  Dices,
  HelpCircle,
  Heart,
  RotateCcw,
  CheckCircle2,
  XCircle,
  ArrowRight,
  Flame,
  Award,
} from 'lucide-react';
import { AnimeItem } from '../../types/anime';
import {
  getAnimeQuests,
  recordQuestAction,
  recordTriviaScore,
  getTriviaStats,
  QuestItem,
} from '../../services/watchlistStorage';

interface Props {
  anime: AnimeItem;
  onSelectAnime?: (animeId: number) => void;
}

type InteractiveTab = 'quests' | 'trivia' | 'match' | 'spin';

interface TriviaQuestion {
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
}

export const AnimeInteractiveZone: React.FC<Props> = ({ anime, onSelectAnime }) => {
  const [activeTab, setActiveTab] = useState<InteractiveTab>('quests');
  const [quests, setQuests] = useState<QuestItem[]>([]);

  // Trivia State
  const [triviaQuestions, setTriviaQuestions] = useState<TriviaQuestion[]>([]);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isAnswerRevealed, setIsAnswerRevealed] = useState(false);
  const [triviaScore, setTriviaScore] = useState(0);
  const [isTriviaFinished, setIsTriviaFinished] = useState(false);

  // Match State
  const [preferredMood, setPreferredMood] = useState<'hype' | 'emotional' | 'dark' | 'chill'>('hype');
  const [preferredPacing, setPreferredPacing] = useState<'fast' | 'balanced' | 'slow'>('fast');
  const [compatibilityScore, setCompatibilityScore] = useState<number>(88);

  // Spin State
  const [isSpinning, setIsSpinning] = useState(false);
  const [spunResult, setSpunResult] = useState<any | null>(null);

  useEffect(() => {
    setQuests(getAnimeQuests(anime.id));
    generateTriviaQuestions();
  }, [anime.id]);

  // Generate dynamic, verified questions from real anime metadata
  const generateTriviaQuestions = () => {
    const qList: TriviaQuestion[] = [];
    const mainStudio = anime.studios?.[0] || 'Unknown Studio';
    const releaseYear = anime.year ? String(anime.year) : '2020s';
    const mainChar = anime.characters?.[0]?.name || 'the main protagonist';
    const primaryGenre = anime.genres?.[0] || 'Action';

    // Q1: Studio
    if (anime.studios && anime.studios.length > 0) {
      const distractors = ['MAPPA', 'Ufotable', 'Wit Studio', 'A-1 Pictures', 'Bones', 'Madhouse'].filter(
        (s) => s.toLowerCase() !== mainStudio.toLowerCase()
      );
      const opts = [mainStudio, distractors[0], distractors[1], distractors[2]].sort(() => Math.random() - 0.5);
      qList.push({
        question: `Which renowned studio animated "${anime.title}"?`,
        options: opts,
        correctAnswer: mainStudio,
        explanation: `Produced and animated by ${mainStudio}.`,
      });
    }

    // Q2: Release Year
    if (anime.year) {
      const y = anime.year;
      const opts = [String(y), String(y - 2), String(y + 1), String(y - 4)].sort(() => Math.random() - 0.5);
      qList.push({
        question: `In which year did "${anime.title}" officially premiere?`,
        options: opts,
        correctAnswer: String(y),
        explanation: `First premiered in ${y}.`,
      });
    }

    // Q3: Character
    if (anime.characters && anime.characters.length > 0) {
      const opts = [
        mainChar,
        'Yuji Itadori',
        'Tanjiro Kamado',
        'Denji',
        'Eren Yeager',
      ].filter((v, i, a) => a.indexOf(v) === i).slice(0, 4).sort(() => Math.random() - 0.5);
      qList.push({
        question: `Which character plays a leading role in "${anime.title}"?`,
        options: opts,
        correctAnswer: mainChar,
        explanation: `${mainChar} is a prominent cast member in this series.`,
      });
    }

    // Q4: Genre
    if (anime.genres && anime.genres.length > 0) {
      const distractors = ['Romance', 'Mecha', 'Sports', 'Horror', 'Music'].filter(
        (g) => !anime.genres.includes(g)
      );
      const opts = [primaryGenre, distractors[0], distractors[1], distractors[2]].sort(() => Math.random() - 0.5);
      qList.push({
        question: `What primary genre classification defines "${anime.title}"?`,
        options: opts,
        correctAnswer: primaryGenre,
        explanation: `Classified officially under the ${primaryGenre} category.`,
      });
    }

    // Q5: Format / Episodes
    if (anime.episodes) {
      const ep = anime.episodes;
      const opts = [`${ep} Episodes`, `${ep + 6} Episodes`, `${Math.max(12, ep - 4)} Episodes`, '100+ Episodes'].sort(
        () => Math.random() - 0.5
      );
      qList.push({
        question: `How many episodes are contained in this broadcast of "${anime.title}"?`,
        options: opts,
        correctAnswer: `${ep} Episodes`,
        explanation: `Total episode count is ${ep}.`,
      });
    }

    setTriviaQuestions(qList);
    setCurrentQIndex(0);
    setSelectedAnswer(null);
    setIsAnswerRevealed(false);
    setTriviaScore(0);
    setIsTriviaFinished(false);
  };

  const handleAnswerSelect = (option: string) => {
    if (isAnswerRevealed) return;
    setSelectedAnswer(option);
    setIsAnswerRevealed(true);

    const currentQ = triviaQuestions[currentQIndex];
    if (option === currentQ.correctAnswer) {
      setTriviaScore((prev) => prev + 1);
    }
  };

  const handleNextQuestion = () => {
    if (currentQIndex < triviaQuestions.length - 1) {
      setCurrentQIndex((prev) => prev + 1);
      setSelectedAnswer(null);
      setIsAnswerRevealed(false);
    } else {
      setIsTriviaFinished(true);
      recordTriviaScore(triviaScore + (selectedAnswer === triviaQuestions[currentQIndex]?.correctAnswer ? 0 : 0), triviaQuestions.length);
      recordQuestAction(anime.id, 'test_trivia');
      setQuests(getAnimeQuests(anime.id));
    }
  };

  // Compute Match Score
  useEffect(() => {
    let base = 75;
    const g = (anime.genres || []).map((x) => x.toLowerCase());
    if (preferredMood === 'hype' && (g.includes('action') || g.includes('shounen') || g.includes('supernatural'))) {
      base += 15;
    }
    if (preferredMood === 'dark' && (g.includes('psychological') || g.includes('mystery') || g.includes('horror') || g.includes('drama'))) {
      base += 18;
    }
    if (preferredMood === 'emotional' && (g.includes('drama') || g.includes('romance') || g.includes('slice of life'))) {
      base += 16;
    }
    if (preferredMood === 'chill' && (g.includes('comedy') || g.includes('fantasy') || g.includes('adventure'))) {
      base += 14;
    }
    if (preferredPacing === 'fast' && (anime.score || 7.5) >= 8.0) base += 5;
    setCompatibilityScore(Math.min(99, Math.max(62, base)));
  }, [preferredMood, preferredPacing, anime]);

  // Spin & Discover
  const handleSpin = () => {
    if (isSpinning) return;
    setIsSpinning(true);
    setSpunResult(null);

    // Pick from relations or franchise entries
    const candidates = anime.relations?.flatMap((r) => r.entry) || [];
    const pool = candidates.length > 0 ? candidates : [{ id: anime.id, name: anime.title, type: 'anime' }];

    setTimeout(() => {
      const chosen = pool[Math.floor(Math.random() * pool.length)];
      setSpunResult(chosen);
      setIsSpinning(false);
    }, 1200);
  };

  const completedQuestsCount = quests.filter((q) => q.completed).length;
  const totalXp = quests.filter((q) => q.completed).reduce((acc, q) => acc + q.xp, 0);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Subtab Navigation */}
      <div className="flex items-center gap-1.5 p-1 bg-slate-950/80 rounded-xl border border-slate-800/80 overflow-x-auto scrollbar-none">
        <button
          onClick={() => setActiveTab('quests')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'quests'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <Trophy className="w-3.5 h-3.5" />
          <span>Anime Quests ({completedQuestsCount}/{quests.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('trivia')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'trivia'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <HelpCircle className="w-3.5 h-3.5" />
          <span>Anime Trivia Quiz</span>
        </button>

        <button
          onClick={() => setActiveTab('match')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'match'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <Heart className="w-3.5 h-3.5" />
          <span>Taste Matcher</span>
        </button>

        <button
          onClick={() => setActiveTab('spin')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'spin'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <Dices className="w-3.5 h-3.5" />
          <span>Spin & Discover</span>
        </button>
      </div>

      {/* TAB 1: ANIME QUESTS */}
      {activeTab === 'quests' && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-950/60 via-slate-900 to-slate-900 border border-purple-800/40 shadow-xl flex items-center justify-between flex-wrap gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs font-bold text-purple-300 uppercase tracking-wider">
                <Sparkles className="w-4 h-4 text-yellow-300" />
                <span>Discovery Quests for {anime.title}</span>
              </div>
              <p className="text-xs text-slate-300">
                Complete all 5 exploration milestones to earn Otaku XP on this anime.
              </p>
            </div>
            <div className="px-3.5 py-1.5 rounded-xl bg-purple-600/30 border border-purple-500/50 text-right">
              <span className="text-[10px] text-purple-200 uppercase font-bold block">Earned XP</span>
              <span className="text-sm font-mono font-black text-white">+{totalXp} XP</span>
            </div>
          </div>

          <div className="space-y-2">
            {quests.map((q) => (
              <div
                key={q.id}
                className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                  q.completed
                    ? 'bg-emerald-950/30 border-emerald-700/50 text-white'
                    : 'bg-slate-900/80 border-slate-800 text-slate-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
                      q.completed ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {q.completed ? <CheckCircle2 className="w-4 h-4" /> : <Award className="w-4 h-4" />}
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-white">{q.title}</h5>
                    <p className="text-[11px] text-slate-400">{q.description}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs font-mono font-bold text-purple-300">+{q.xp} XP</span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                      q.completed ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {q.completed ? 'Completed' : 'Pending'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: ANIME TRIVIA */}
      {activeTab === 'trivia' && (
        <div className="space-y-4">
          {triviaQuestions.length === 0 ? (
            <div className="p-8 text-center bg-slate-900 rounded-2xl border border-slate-800 text-slate-400 text-xs">
              Loading trivia questions for {anime.title}...
            </div>
          ) : !isTriviaFinished ? (
            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <span className="text-xs font-mono font-bold text-indigo-400">
                  Question {currentQIndex + 1} of {triviaQuestions.length}
                </span>
                <span className="text-xs font-mono text-slate-400">
                  Score: <strong className="text-emerald-400">{triviaScore}</strong>
                </span>
              </div>

              <h4 className="text-sm font-bold text-white leading-relaxed">
                {triviaQuestions[currentQIndex]?.question}
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2">
                {triviaQuestions[currentQIndex]?.options.map((option, idx) => {
                  const isSelected = selectedAnswer === option;
                  const isCorrect = option === triviaQuestions[currentQIndex]?.correctAnswer;

                  let btnStyle = 'bg-slate-800/80 hover:bg-slate-750 text-slate-200 border-slate-700/80';
                  if (isAnswerRevealed) {
                    if (isCorrect) {
                      btnStyle = 'bg-emerald-600 text-white border-emerald-400 shadow-md';
                    } else if (isSelected) {
                      btnStyle = 'bg-rose-600 text-white border-rose-400';
                    } else {
                      btnStyle = 'opacity-50 bg-slate-800 text-slate-400 border-slate-800';
                    }
                  }

                  return (
                    <button
                      key={idx}
                      disabled={isAnswerRevealed}
                      onClick={() => handleAnswerSelect(option)}
                      className={`p-3 rounded-xl border text-xs font-semibold text-left transition-all cursor-pointer flex items-center justify-between ${btnStyle}`}
                    >
                      <span>{option}</span>
                      {isAnswerRevealed && isCorrect && <CheckCircle2 className="w-4 h-4 text-white" />}
                      {isAnswerRevealed && isSelected && !isCorrect && <XCircle className="w-4 h-4 text-white" />}
                    </button>
                  );
                })}
              </div>

              {isAnswerRevealed && (
                <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                  <p className="text-xs text-slate-300 italic">
                    {triviaQuestions[currentQIndex]?.explanation}
                  </p>
                  <button
                    onClick={handleNextQuestion}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 ml-3"
                  >
                    <span>{currentQIndex === triviaQuestions.length - 1 ? 'Finish Quiz' : 'Next'}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="p-8 rounded-2xl bg-gradient-to-b from-indigo-950/60 to-slate-900 border border-indigo-700/50 text-center space-y-4">
              <div className="w-12 h-12 mx-auto rounded-full bg-indigo-600/30 border border-indigo-500/50 flex items-center justify-center text-yellow-300">
                <Trophy className="w-6 h-6" />
              </div>
              <h4 className="text-lg font-black text-white">Quiz Completed!</h4>
              <p className="text-xs text-slate-300 max-w-md mx-auto">
                You scored <strong className="text-emerald-400 text-sm font-mono">{triviaScore}</strong> out of{' '}
                <strong className="text-white text-sm font-mono">{triviaQuestions.length}</strong> on{' '}
                <strong className="text-indigo-300">{anime.title}</strong>!
              </p>
              <button
                onClick={generateTriviaQuestions}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-xl shadow-lg transition-colors cursor-pointer inline-flex items-center gap-2"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Play Again</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: TASTE MATCHER */}
      {activeTab === 'match' && (
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-5">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                <Heart className="w-4 h-4 text-rose-500 fill-rose-500" />
                <span>Anime Compatibility Matcher</span>
              </h4>
              <p className="text-xs text-slate-400 mt-0.5">
                Select your preferred mood to test compatibility with this anime.
              </p>
            </div>

            <div className="text-right">
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Match Score</span>
              <span className="text-xl font-black text-emerald-400 font-mono">{compatibilityScore}%</span>
            </div>
          </div>

          <div className="space-y-3">
            <span className="text-xs font-bold text-slate-300 block">Select Desired Mood:</span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { id: 'hype', label: '🔥 High Octane / Hype' },
                { id: 'dark', label: '🌑 Psychological / Dark' },
                { id: 'emotional', label: '💧 Deep Emotion / Tearjerker' },
                { id: 'chill', label: '🌿 Relaxed / Wholesome' },
              ].map((m) => (
                <button
                  key={m.id}
                  onClick={() => setPreferredMood(m.id as any)}
                  className={`p-2.5 rounded-xl text-xs font-semibold text-center border transition-all cursor-pointer ${
                    preferredMood === m.id
                      ? 'bg-indigo-600 text-white border-indigo-500 shadow-md'
                      : 'bg-slate-800/80 hover:bg-slate-750 text-slate-300 border-slate-700'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 text-xs text-slate-300 flex items-center justify-between">
            <span>
              {compatibilityScore >= 85
                ? '⭐ Superb Match! Highly aligned with this anime\'s narrative pace and genre DNA.'
                : '✨ Decent Match! Recommended if you appreciate varied genre storytelling.'}
            </span>
          </div>
        </div>
      )}

      {/* TAB 4: SPIN & DISCOVER */}
      {activeTab === 'spin' && (
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 text-center space-y-4">
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-white flex items-center justify-center gap-1.5">
              <Dices className="w-4 h-4 text-indigo-400" />
              <span>Spin & Discover Franchise Catalog</span>
            </h4>
            <p className="text-xs text-slate-400">
              Spin to randomly pick an entry from the connected universe or franchise timeline!
            </p>
          </div>

          <div className="py-6">
            <button
              disabled={isSpinning}
              onClick={handleSpin}
              className={`px-6 py-3 rounded-2xl font-bold text-xs uppercase tracking-wider text-white shadow-xl transition-all cursor-pointer ${
                isSpinning
                  ? 'bg-slate-700 animate-pulse'
                  : 'bg-gradient-to-r from-indigo-600 via-purple-600 to-rose-600 hover:scale-105 active:scale-95'
              }`}
            >
              {isSpinning ? 'Spinning Destiny...' : '🎲 Spin Random Entry'}
            </button>
          </div>

          {spunResult && (
            <div className="p-4 rounded-xl bg-indigo-950/50 border border-indigo-700/50 animate-in fade-in space-y-2 max-w-md mx-auto">
              <span className="text-[10px] text-indigo-300 font-bold uppercase tracking-wider block">
                Picked Entry:
              </span>
              <h5 className="text-sm font-bold text-white">{spunResult.name}</h5>
              {onSelectAnime && spunResult.id && (
                <button
                  onClick={() => onSelectAnime(spunResult.id)}
                  className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-colors mt-2"
                >
                  Jump to {spunResult.name} →
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
