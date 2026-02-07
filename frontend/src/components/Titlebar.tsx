import Link from "next/link";
import ThemeToggle from "./ThemeToggle";

export default function Titlebar() {
  return (
    <header className="w-full bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <Link
              href="/"
              className="flex items-center gap-2 text-gray-900 dark:text-white hover:opacity-80 transition-opacity"
            >
              <span className="text-2xl">🧠</span>
              <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                ML Degrees
              </span>
            </Link>
          </div>
          <nav className="flex items-center space-x-4">
            <Link
              href="/"
              className="text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              Programs
            </Link>
            <Link
              href="/guide"
              className="text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              Guide
            </Link>
            <Link
              href="/about"
              className="text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              About
            </Link>
            <ThemeToggle />
          </nav>
        </div>
      </div>
    </header>
  );
}
