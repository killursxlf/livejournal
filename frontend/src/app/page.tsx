"use client";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center p-4">
      {/* Основной контейнер с контентом */}
      <div className="max-w-3xl w-full text-center">
        {/* Заголовок и описание */}
        <header>
          <h1 className="text-5xl font-extrabold text-gray-800">
            Добро пожаловать в LiveJournal
          </h1>
          <p className="mt-4 text-xl text-gray-600">
            Ваш персональный блог и сообщество для обмена идеями, историями и вдохновением.
          </p>
        </header>

        {/* Кнопки входа/регистрации */}
        <div className="mt-6 flex justify-center space-x-4">
          <a
            href="/login"
            className="px-6 py-3 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
          >
            Войти
          </a>
          <a
            href="/register"
            className="px-6 py-3 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition"
          >
            Регистрация
          </a>
        </div>

        {/* Дополнительная информация */}
        <div className="mt-10 text-left text-gray-700">
          <section>
            <h2 className="text-3xl font-bold mb-2">О проекте</h2>
            <p className="text-lg">
              LiveJournal – уникальная платформа для создания личных блогов, где вы можете делиться своими историями, идеями и находить единомышленников. Здесь вас ждут простота, удобство и множество возможностей для самовыражения.
            </p>
          </section>

          <section className="mt-8">
            <h2 className="text-3xl font-bold mb-2">Особенности</h2>
            <ul className="list-disc list-inside text-lg">
              <li>Лёгкая авторизация через Google или логин и пароль.</li>
              <li>Создание, редактирование и удаление публикаций.</li>
              <li>Лента рекомендаций с постами пользователей в удобном формате.</li>
              <li>Настройка профиля с добавлением тегов и тем.</li>
              <li>Активное сообщество для обмена идеями и вдохновения.</li>
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}
