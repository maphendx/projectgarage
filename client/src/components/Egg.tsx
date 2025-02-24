'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';

interface Position {
  x: number;
  y: number;
}
interface SnakeGameProps {
  userPhoto?: string;
}
const GRID_SIZE = 30;
const BLOCK_SIZE = 14;
const GAME_SPEED = 70;
const INITIAL_SNAKE_SIZE = 6;

export default function SnakeGame({
  userPhoto = '/default-profile.jpg',
}: SnakeGameProps) {
  const [snake, setSnake] = useState<Position[]>([]);
  const [apple, setApple] = useState<Position>({ x: 0, y: 0 });
  const [direction, setDirection] = useState<string>('right');
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [score, setScore] = useState<number>(0);
  const [highScore, setHighScore] = useState<number>(
    Number(localStorage.getItem('snakeHighScore')) || 0,
  );

  const generateApple = useCallback((): Position => {
    const newApple = {
      x: Math.floor(Math.random() * GRID_SIZE),
      y: Math.floor(Math.random() * GRID_SIZE),
    };
    return newApple;
  }, []);

  const initGame = useCallback(() => {
    const initialSnake: Position[] = [];
    const xPos = Math.floor(GRID_SIZE / 2);
    const yPos = Math.floor(GRID_SIZE / 2);

    for (let i = 0; i < INITIAL_SNAKE_SIZE; i++) {
      initialSnake.push({ x: xPos - i, y: yPos });
    }

    setSnake(initialSnake);
    setApple(generateApple());
    setDirection('right');
    setScore(0);
    setIsGameOver(false);
  }, [generateApple]);

  useEffect(() => {
    initGame();
  }, [initGame]);

  const moveSnake = useCallback(() => {
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

      if (newSnake.some((part) => part.x === head.x && part.y === head.y)) {
        setIsGameOver(true);
        return prevSnake;
      }

      newSnake.unshift(head);

      if (head.x === apple.x && head.y === apple.y) {
        setScore((prev) => {
          const newScore = prev + 1;
          if (newScore > highScore) {
            setHighScore(newScore);
            localStorage.setItem('snakeHighScore', newScore.toString());
          }
          return newScore;
        });
        setApple(generateApple());
      } else {
        newSnake.pop();
      }

      return newSnake;
    });
  }, [direction, apple, highScore, generateApple]);

  useEffect(() => {
    if (isGameOver) return;

    const gameLoop = setInterval(moveSnake, GAME_SPEED);
    return () => clearInterval(gameLoop);
  }, [isGameOver, moveSnake]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isGameOver && e.code === 'Space') {
        initGame();
        return;
      }

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
  }, [direction, isGameOver, initGame]);

  return (
    <div className='flex flex-col items-center justify-center p-4'>
      <div className='mb-4 text-2xl'>
        <span>НАЙБІЛЬШЕ: {highScore}</span>
        <span className='ml-8'>ЗАХАВАВ: {score}</span>
      </div>
      <div
        className='relative border-2 border-gray-600 bg-[#393950]'
        style={{
          width: GRID_SIZE * BLOCK_SIZE,
          height: GRID_SIZE * BLOCK_SIZE,
        }}
      >
        {isGameOver && (
          <div className='absolute inset-0 flex flex-col items-center justify-center bg-black/70 backdrop-blur-sm'>
            <p className='mb-4 text-2xl text-white'>Вмер, йобабоба!</p>
            <p className='mb-4 text-xl text-white'>Захавав: {score}</p>
            <button
              onClick={initGame}
              className='rounded bg-green-500 px-4 py-2 text-white hover:bg-green-600'
            >
              Похавати ще раз (Space)
            </button>
          </div>
        )}
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
              <Image
                src={userPhoto}
                alt='Snake head'
                width={BLOCK_SIZE}
                height={BLOCK_SIZE}
                className='rounded-full'
                priority
              />
            ) : (
              <div className='h-full w-full bg-green-500' />
            )}
          </motion.div>
        ))}
        <motion.div
          className='absolute bg-red-500'
          style={{
            width: BLOCK_SIZE,
            height: BLOCK_SIZE,
            x: apple.x * BLOCK_SIZE,
            y: apple.y * BLOCK_SIZE,
          }}
        />
      </div>
    </div>
  );
}
