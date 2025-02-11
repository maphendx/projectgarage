'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

const GRID_SIZE = 20;
const INIT_SNAKE = [{ x: 5, y: 5 }];
const INIT_DIRECTION = { x: 1, y: 0 };
const INIT_FOOD = { x: 10, y: 10 };
const GAME_SPEED = 150;

export default function SnakeGame() {
  const [snake, setSnake] = useState(INIT_SNAKE);
  const [direction, setDirection] = useState(INIT_DIRECTION);
  const [food, setFood] = useState(INIT_FOOD);
  const [isGameOver, setIsGameOver] = useState(false);
  const [points, setPoints] = useState(0);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const keyDirections: { [key: string]: { x: number; y: number } } = {
        ArrowUp: { x: 0, y: -1 },
        ArrowDown: { x: 0, y: 1 },
        ArrowLeft: { x: -1, y: 0 },
        ArrowRight: { x: 1, y: 0 },
      };

      const newDirection = keyDirections[e.key];

      if (newDirection) {
        const isOppositeDirection =
          (direction.x === -newDirection.x && direction.y === 0) ||
          (direction.y === -newDirection.y && direction.x === 0);

        if (!isOppositeDirection) {
          setDirection(newDirection);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [direction]);

  useEffect(() => {
    if (isGameOver) return;

    const interval = setInterval(() => {
      setSnake((prevSnake) => {
        const newHead = {
          x: prevSnake[0].x + direction.x,
          y: prevSnake[0].y + direction.y,
        };

        if (
          newHead.x < 0 ||
          newHead.x >= GRID_SIZE ||
          newHead.y < 0 ||
          newHead.y >= GRID_SIZE ||
          prevSnake.some(
            (segment) => segment.x === newHead.x && segment.y === newHead.y,
          )
        ) {
          setIsGameOver(true);
          return prevSnake;
        }

        const newSnake = [newHead, ...prevSnake];
        if (newHead.x === food.x && newHead.y === food.y) {
          setPoints((prev) => prev + 10);
          setFood({
            x: Math.floor(Math.random() * GRID_SIZE),
            y: Math.floor(Math.random() * GRID_SIZE),
          });
        } else {
          newSnake.pop();
        }
        return newSnake;
      });
    }, 150);
    return () => clearInterval(interval);
  }, [direction, food, isGameOver]);

  const handleRestart = () => {
    setSnake(INIT_SNAKE);
    setDirection(INIT_DIRECTION);
    setFood(INIT_FOOD);
    setIsGameOver(false);
    setPoints(0);
  };

  return (
    <div className='flex flex-col items-center justify-center p-4'>
      <div className='mb-4 text-2xl font-bold text-[#B5D6E7]'>
        Нажрав: {points}
      </div>
      <div className='relative h-[400px] w-[400px] overflow-hidden rounded-lg border-2 border-[#6374B6] bg-[#1C1C1F]'>
        {isGameOver && (
          <div className='absolute inset-0 flex flex-col items-center justify-center bg-black/70 backdrop-blur-sm'>
            <p className='mb-4 text-2xl text-white'>Вмер, йоуу!</p>
            <p className='mb-4 text-xl text-white'>Нахавав: {points}</p>
            <button
              onClick={handleRestart}
              className='rounded bg-green-500 px-4 py-2 text-white transition hover:bg-green-600'
            >
              Похавати знову
            </button>
          </div>
        )}
        {snake.map((segment, i) => (
          <motion.div
            key={i}
            className='absolute h-5 w-5 rounded bg-green-500'
            animate={{ x: segment.x * 20, y: segment.y * 20 }}
            transition={{
              type: 'tween',
              duration: GAME_SPEED / 1000,
              ease: 'linear',
            }}
          />
        ))}
        <motion.div
          className='absolute h-5 w-5 rounded bg-red-500'
          animate={{ x: food.x * 20, y: food.y * 20 }}
          transition={{
            type: 'tween',
            duration: 0.2,
          }}
        />
      </div>
    </div>
  );
}
