export default function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-midnight-50">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-midnight-200 border-t-gold-500 rounded-full animate-spin" />
        <p className="text-midnight-600 font-medium">Loading…</p>
      </div>
    </div>
  );
}
