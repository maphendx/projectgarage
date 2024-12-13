import Image from "next/image";
import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-r from-indigo-100 via-blue-50 to-white">
      {/* Navbar */}
      <nav className="bg-blue-600 text-white py-6 shadow-md">
        <div className="container mx-auto flex justify-between items-center px-6 md:px-12">
          <Link href="/" className="text-3xl font-extrabold tracking-wide hover:text-blue-200 transition">
            MusicHub
          </Link>
          <div className="space-x-6 text-lg">
            <Link href="/login" className="hover:underline transition duration-200">Login</Link>
            <Link href="/signup" className="px-6 py-2 bg-blue-500 rounded-md hover:bg-blue-600 text-white font-semibold transition duration-200">
              Sign Up
            </Link>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-grow flex justify-center items-center bg-gradient-to-br from-white to-blue-100 px-4 md:px-12">
        <div className="bg-white shadow-lg rounded-lg p-10 w-full max-w-xl">
          <div className="flex justify-center mb-8">
            <Image
              src="/next.svg"
              alt="MusicHub Logo"
              width={120}
              height={120}
            />
          </div>
          <h1 className="text-4xl font-bold text-center mb-6 text-blue-700">Welcome to MusicHub</h1>
          <p className="text-center text-lg mb-6 text-gray-700">
            Connect with artists, share your music, and discover new beats in our vibrant community.
          </p>
          <div className="flex flex-col space-y-6">
            <Link href="/login">
              <button
                type="button"
                className="w-full py-3 px-4 rounded-md bg-blue-600 hover:bg-blue-700 text-white font-semibold transition duration-200 ease-in-out"
              >
                Login
              </button>
            </Link>
            <Link href="/signup">
              <button
                type="button"
                className="w-full py-3 px-4 rounded-md border border-blue-300 text-blue-700 hover:bg-blue-50 transition duration-200 ease-in-out"
              >
                Sign Up
              </button>
            </Link>
          </div>
          <div className="mt-10 text-center">
            <Link href="https://musichub.com/learn" target="_blank" rel="noopener noreferrer">
              <span className="text-blue-600 hover:underline">Learn More</span>
            </Link>
            {" | "}
            <Link href="https://musichub.com/examples" target="_blank" rel="noopener noreferrer">
              <span className="text-blue-600 hover:underline">Examples</span>
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-blue-600 text-white text-center py-6 mt-10 shadow-inner">
        <div className="container mx-auto text-sm">
          &copy; {new Date().getFullYear()} MusicHub. All rights reserved.
        </div>
      </footer>
    </div>
  );
}