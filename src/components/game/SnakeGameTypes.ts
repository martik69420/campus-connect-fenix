
export interface SnakeGameProps {
  onGameEnd: (score: number) => Promise<void>;
}
