'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';

interface Position {
  x: number;
  y: number;
}

interface SnakeGameProps {
  userPhoto?: string;
}

// Game constants
const GRID_SIZE = 30;
const BLOCK_SIZE = 14;
const GAME_SPEED = 70;
const INITIAL_SNAKE_SIZE = 6;

// Musical food types with corresponding point values
const MUSICAL_FOODS = [
  { type: 'note', points: 1, color: 'bg-yellow-400', emoji: '♪' },
  { type: 'eighth', points: 2, color: 'bg-blue-400', emoji: '♫' },
  { type: 'treble', points: 3, color: 'bg-purple-500', emoji: '𝄞' },
  { type: 'vinyl', points: 5, color: 'bg-red-500', emoji: '💿' },
];

export default function MusicalSnakeGame({
  userPhoto = '/default-profile.jpg',
}: SnakeGameProps) {
  const [snake, setSnake] = useState<Position[]>([]);
  const [food, setFood] = useState<
    Position & { type: string; points: number; color: string; emoji: string }
  >({
    x: 0,
    y: 0,
    type: 'note',
    points: 1,
    color: 'bg-yellow-400',
    emoji: '♪',
  });
  const [direction, setDirection] = useState<string>('right');
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [score, setScore] = useState<number>(0);
  const [highScore, setHighScore] = useState<number>(
    typeof window !== 'undefined'
      ? Number(localStorage.getItem('musicalSnakeHighScore')) || 0
      : 0,
  );
  const [combo, setCombo] = useState<number>(0);
  const [level, setLevel] = useState<number>(1);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const comboAudioRef = useRef<HTMLAudioElement | null>(null);
  const gameOverAudioRef = useRef<HTMLAudioElement | null>(null);

  // Generate random musical food
  const generateFood = useCallback((): Position & {
    type: string;
    points: number;
    color: string;
    emoji: string;
  } => {
    const randomValue = Math.random();
    let selectedFood;

    if (randomValue > 0.95) {
      selectedFood = MUSICAL_FOODS[3]; // 5% chance for vinyl (5 points)
    } else if (randomValue > 0.85) {
      selectedFood = MUSICAL_FOODS[2]; // 10% chance for treble clef (3 points)
    } else if (randomValue > 0.65) {
      selectedFood = MUSICAL_FOODS[1]; // 20% chance for eighth note (2 points)
    } else {
      selectedFood = MUSICAL_FOODS[0]; // 65% chance for quarter note (1 point)
    }

    const newFood = {
      x: Math.floor(Math.random() * GRID_SIZE),
      y: Math.floor(Math.random() * GRID_SIZE),
      ...selectedFood,
    };

    return newFood;
  }, []);

  // Initialize game state
  const initGame = useCallback(() => {
    const initialSnake: Position[] = [];
    const xPos = Math.floor(GRID_SIZE / 2);
    const yPos = Math.floor(GRID_SIZE / 2);

    for (let i = 0; i < INITIAL_SNAKE_SIZE; i++) {
      initialSnake.push({ x: xPos - i, y: yPos });
    }

    setSnake(initialSnake);
    setFood(generateFood());
    setDirection('right');
    setScore(0);
    setCombo(0);
    setLevel(1);
    setIsGameOver(false);
    setIsPaused(false);
  }, [generateFood]);

  // Set up audio elements on component mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      audioRef.current = new Audio('/sounds/eat.mp3');
      comboAudioRef.current = new Audio('/sounds/combo.mp3');
      gameOverAudioRef.current = new Audio('/sounds/gameover.mp3');

      // Create audio elements if they don't exist
      if (!document.getElementById('eat-sound')) {
        const eatSound = document.createElement('audio');
        eatSound.id = 'eat-sound';
        eatSound.src = '/sounds/eat.mp3';
        document.body.appendChild(eatSound);
      }

      if (!document.getElementById('combo-sound')) {
        const comboSound = document.createElement('audio');
        comboSound.id = 'combo-sound';
        comboSound.src = '/sounds/combo.mp3';
        document.body.appendChild(comboSound);
      }

      if (!document.getElementById('gameover-sound')) {
        const gameOverSound = document.createElement('audio');
        gameOverSound.id = 'gameover-sound';
        gameOverSound.src = '/sounds/gameover.mp3';
        document.body.appendChild(gameOverSound);
      }

      setHighScore(Number(localStorage.getItem('musicalSnakeHighScore')) || 0);
    }
  }, []);

  useEffect(() => {
    initGame();
  }, [initGame]);

  // Calculate game speed based on level
  const getGameSpeed = useCallback(() => {
    return Math.max(GAME_SPEED - (level - 1) * 5, 40); // Minimum speed of 40ms
  }, [level]);

  // Move the snake
  const moveSnake = useCallback(() => {
    if (isPaused) return;

    setSnake((prevSnake) => {
      const newSnake = [...prevSnake];
      const head = { ...newSnake[0] };

      switch (direction) {
        case 'left':
          head.x = head.x <= 0 ? GRID_SIZE - 1 : head.x - 1;
          break;
        case 'up':
          head.y = head.y <= 0 ? GRID_SIZE - 1 : head.y - 1;
          break;
        case 'right':
          head.x = head.x >= GRID_SIZE - 1 ? 0 : head.x + 1;
          break;
        case 'down':
          head.y = head.y >= GRID_SIZE - 1 ? 0 : head.y + 1;
          break;
      }

      // Check for collision with self
      if (
        newSnake.some(
          (part, index) => index > 0 && part.x === head.x && part.y === head.y,
        )
      ) {
        setIsGameOver(true);
        if (gameOverAudioRef.current) {
          gameOverAudioRef.current
            .play()
            .catch((e) => console.error('Error playing game over sound:', e));
        }
        return prevSnake;
      }

      newSnake.unshift(head);

      // Check for food collision
      if (head.x === food.x && head.y === food.y) {
        const pointsEarned = food.points;
        const newCombo = combo + 1;
        setCombo(newCombo);

        // Play sound effects
        if (audioRef.current) {
          audioRef.current
            .play()
            .catch((e) => console.error('Error playing eat sound:', e));
        }

        // Play combo sound if combo is a multiple of 5
        if (newCombo % 5 === 0 && comboAudioRef.current) {
          comboAudioRef.current
            .play()
            .catch((e) => console.error('Error playing combo sound:', e));
        }

        // Calculate combo bonus (every 5 combos doubles the points)
        const comboMultiplier = Math.floor(newCombo / 5) + 1;
        const totalPoints = pointsEarned * comboMultiplier;

        // Update score and possibly level
        setScore((prev) => {
          const newScore = prev + totalPoints;

          // Update level every 20 points
          if (Math.floor(newScore / 20) > Math.floor(prev / 20)) {
            setLevel(Math.floor(newScore / 20) + 1);
          }

          // Update high score if needed
          if (newScore > highScore) {
            setHighScore(newScore);
            if (typeof window !== 'undefined') {
              localStorage.setItem(
                'musicalSnakeHighScore',
                newScore.toString(),
              );
            }
          }

          return newScore;
        });

        // Generate new food
        setFood(generateFood());
      } else {
        newSnake.pop();
      }

      return newSnake;
    });
  }, [direction, food, combo, highScore, generateFood, isPaused]);

  // Game loop
  useEffect(() => {
    if (isGameOver || isPaused) return;

    const gameLoop = setInterval(moveSnake, getGameSpeed());
    return () => clearInterval(gameLoop);
  }, [isGameOver, moveSnake, isPaused, getGameSpeed]);

  // Handle keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isGameOver && e.code === 'Space') {
        initGame();
        return;
      }

      if (e.code === 'Space') {
        setIsPaused((prev) => !prev);
        return;
      }

      if (isPaused) return;

      const keyDirections: { [key: string]: string } = {
        ArrowLeft: 'left',
        ArrowUp: 'up',
        ArrowRight: 'right',
        ArrowDown: 'down',
        KeyA: 'left',
        KeyW: 'up',
        KeyD: 'right',
        KeyS: 'down',
      };

      const newDirection = keyDirections[e.code];
      if (newDirection) {
        const oppositeDirections: Record<string, string> = {
          left: 'right',
          right: 'left',
          up: 'down',
          down: 'up',
        };

        if (oppositeDirections[newDirection] !== direction) {
          setDirection(newDirection);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [direction, isGameOver, initGame, isPaused]);

  // Musical terms based on score
  const getMusicTitle = useCallback((score: number) => {
    if (score >= 100) return 'Легенда Рок-н-Ролу';
    if (score >= 80) return 'Рок-Зірка';
    if (score >= 60) return 'Віртуоз';
    if (score >= 40) return 'Соліст';
    if (score >= 20) return 'Музикант';
    if (score >= 10) return 'Початківець';
    return 'Слухач';
  }, []);

  return (
    <div className='flex flex-col items-center justify-center rounded-lg bg-gray-900 p-4'>
      <div className='mb-4 text-2xl text-white'>
        <div className='mb-2 flex w-full justify-between'>
          <span>
            РЕЙТИНГ:{' '}
            <span className='text-yellow-400'>{getMusicTitle(score)}</span>
          </span>
          <span>
            РІВЕНЬ: <span className='text-green-400'>{level}</span>
          </span>
        </div>
        <div className='flex w-full justify-between'>
          <span>
            РЕКОРД: <span className='text-purple-400'>{highScore}</span>
          </span>
          <span>
            ОЧКИ: <span className='text-blue-400'>{score}</span>
          </span>
          <span>
            КОМБО:{' '}
            <span className={`${combo >= 5 ? 'text-red-400' : 'text-white'}`}>
              {combo}x
            </span>
          </span>
        </div>
      </div>

      <div
        className='relative border-2 border-purple-800 bg-gray-800'
        style={{
          width: GRID_SIZE * BLOCK_SIZE,
          height: GRID_SIZE * BLOCK_SIZE,
        }}
      >
        {/* Music notes background pattern */}
        <div className='absolute inset-0 opacity-10'>
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={`staff-${i}`}
              className='absolute h-px w-full bg-white'
              style={{ top: `${20 + i * 15}%` }}
            />
          ))}
        </div>

        {isGameOver && (
          <div className='absolute inset-0 flex flex-col items-center justify-center bg-black/70 backdrop-blur-sm'>
            <p className='mb-4 text-2xl text-white'>Фінальний акорд!</p>
            <p className='mb-2 text-xl text-white'>Очки: {score}</p>
            <p className='mb-4 text-lg text-purple-400'>
              Ранг: {getMusicTitle(score)}
            </p>
            <button
              onClick={initGame}
              className='rounded bg-purple-600 px-4 py-2 text-white hover:bg-purple-700'
            >
              Зіграти ще раз (Space)
            </button>
          </div>
        )}

        {isPaused && !isGameOver && (
          <div className='absolute inset-0 flex flex-col items-center justify-center bg-black/50 backdrop-blur-sm'>
            <p className='mb-4 text-2xl text-white'>Пауза</p>
            <button
              onClick={() => setIsPaused(false)}
              className='rounded bg-purple-600 px-4 py-2 text-white hover:bg-purple-700'
            >
              Продовжити (Space)
            </button>
          </div>
        )}

        {/* Snake body segments */}
        {snake.map((segment, i) => (
          <motion.div
            key={i}
            className='absolute'
            style={{
              width: BLOCK_SIZE,
              height: BLOCK_SIZE,
              x: segment.x * BLOCK_SIZE,
              y: segment.y * BLOCK_SIZE,
            }}
          >
            {i === 0 ? (
              // Head is the user's profile picture
              <Image
                src={userPhoto}
                alt='Snake head'
                width={BLOCK_SIZE}
                height={BLOCK_SIZE}
                className='rounded-full border border-white'
                priority
              />
            ) : (
              // Body segments with gradient based on position
              <div
                className={`h-full w-full rounded-sm ${
                  i % 3 === 0
                    ? 'bg-purple-500'
                    : i % 3 === 1
                      ? 'bg-blue-500'
                      : 'bg-pink-500'
                }`}
              />
            )}
          </motion.div>
        ))}

        {/* Musical food item */}
        <motion.div
          className={`absolute flex items-center justify-center ${food.color} text-xs font-bold`}
          style={{
            width: BLOCK_SIZE,
            height: BLOCK_SIZE,
            x: food.x * BLOCK_SIZE,
            y: food.y * BLOCK_SIZE,
            borderRadius: '50%',
          }}
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ repeat: Infinity, duration: 1 }}
        >
          {food.emoji}
        </motion.div>
      </div>

      <div className='mt-4 text-sm text-gray-300'>
        <p>Керування: стрілки або WASD | Пауза: Space</p>
        <p className='mt-1'>
          <span className='mr-2'>♪: 1 очко</span>
          <span className='mr-2'>♫: 2 очки</span>
          <span className='mr-2'>𝄞: 3 очки</span>
          <span>💿: 5 очків</span>
        </p>
      </div>
    </div>
  );
}
