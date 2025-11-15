import Processor from "../components/Processor";

export default function Page() {
  return (
    <main className="container">
      <header className="header">
        <h1>Agentic Video Styler</h1>
        <p>Upload a video and choose a style. Processing happens 100% in your browser.</p>
      </header>
      <Processor />
      <footer className="footer">
        <span>Built for Vercel ? No server required</span>
      </footer>
    </main>
  );
}
