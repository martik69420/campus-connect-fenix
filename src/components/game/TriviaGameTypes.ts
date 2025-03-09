
export interface TriviaGameProps {
  onGameEnd: (score: number) => Promise<void>;
}
