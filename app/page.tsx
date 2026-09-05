import LoginButton from "./component/loginButton";

export default function Home() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-black">
      <div className="flex w-full max-w-md flex-col items-center gap-6 rounded-2xl border border-zinc-800 bg-zinc-950 p-10 text-center">
        <div>
          <h1 className="text-3xl font-bold text-white">
            Trading Journal
          </h1>

          <p className="mt-2 text-zinc-400">
            Track, analyze and improve your trading.
          </p>
        </div>

        <LoginButton />
      </div>
    </main>
  );
}