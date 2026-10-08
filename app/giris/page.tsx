import LoginForm from "./LoginForm";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  const target = next && /^\/(admin|girisimci|lideacheck)(\/|\?|$)/.test(next) && !next.includes("\\") ? next : "/girisimci";
  return <LoginForm target={target} />;
}
