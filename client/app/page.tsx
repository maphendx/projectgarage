import Image from "next/image";
import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-gray-100">
      {/* Навігація */}
      <nav className="bg-gray-900/80 backdrop-blur-md py-4 shadow-md fixed top-0 left-0 w-full z-50">
        <div className="container mx-auto flex justify-between items-center px-6 md:px-12">
          <Link href="/" className="text-3xl font-extrabold tracking-wide hover:text-gray-400 transition">
            MusicHub
          </Link>
          <div className="space-x-6 text-lg">
            <Link href="/login" className="hover:underline transition duration-200">Увійти</Link>
            <Link href="/signup" className="px-6 py-2 bg-gray-700 hover:bg-gray-600 rounded-md text-white font-semibold transition duration-200">
              Реєстрація
            </Link>
          </div>
        </div>
      </nav>

      {/* Герой-секція */}
      <header className="flex-grow flex flex-col justify-center items-center text-center px-6 md:px-12 pt-20">
        <div className="max-w-2xl">
          <h1 className="text-5xl md:text-6xl font-extrabold mb-6 text-white leading-tight">
            Ласкаво просимо до <span className="text-gray-400">MusicHub</span>
          </h1>
          <p className="text-lg md:text-xl text-gray-300 mb-8">
            Відкривайте нову музику, спілкуйтеся з артистами та діліться своїми треками на увесь світ.
          </p>
          <div className="flex flex-col md:flex-row justify-center space-y-4 md:space-y-0 md:space-x-6">
            <Link href="/signup">
              <button className="px-8 py-3 rounded-md bg-gray-700 hover:bg-gray-600 text-white text-lg font-semibold transition duration-200">
                Почати
              </button>
            </Link>
            <Link href="/login">
              <button className="px-8 py-3 rounded-md border border-gray-600 text-gray-300 hover:bg-gray-800 text-lg font-semibold transition duration-200">
                Увійти
              </button>
            </Link>
          </div>
        </div>
      </header>

      {/* Features */}
      <section className="bg-gray-800 text-gray-200 py-16 px-6 md:px-12">
        <div className="container mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-10">
            Чому обирають MusicHub?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <div className="flex flex-col items-center text-center">
              <div className="mb-4">
                <Image src="" alt="" width={64} height={64} />
              </div>
              <h3 className="text-xl font-semibold mb-2">Жива спільнота</h3>
              <p className="text-gray-400">
                Спілкуйтеся з артистами та меломанами з усього світу.
              </p>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="mb-4">
                <Image src="" alt="" width={64} height={64} />
              </div>
              <h3 className="text-xl font-semibold mb-2">Відкривайте нові треки</h3>
              <p className="text-gray-400">
                Досліджуйте найсвіжіші композиції та унікальні звуки.
              </p>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="mb-4">
                <Image src="" alt="" width={64} height={64} />
              </div>
              <h3 className="text-xl font-semibold mb-2">Діліться своєю музикою</h3>
              <p className="text-gray-400">
                Завантажуйте свої треки та отримуйте відгуки.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* foooter */}
      <footer className="bg-gray-900 text-gray-500 text-center py-6">
        <div className="container mx-auto text-sm">
          &copy; {new Date().getFullYear()} MusicHub. Усі права захищено.
        </div>
      </footer>
    </div>
  );
}