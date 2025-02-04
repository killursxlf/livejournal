export default function Header() {
    return (
      <header className="bg-blue-600 text-white p-4 shadow-lg">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold">LiveJournal</h1>
          <nav>
            <ul className="flex space-x-4">
              <li><a href="/" className="hover:underline">Главная</a></li>
              <li><a href="/about" className="hover:underline">О проекте</a></li>
              <li><a href="/login" className="hover:underline">Войти</a></li>
            </ul>
          </nav>
        </div>
      </header>
    );
  }
  