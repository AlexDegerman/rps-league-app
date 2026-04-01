export default function AnalysisPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-12 text-center">
      <div className="bg-indigo-50 rounded-2xl p-8 border-2 border-dashed border-indigo-200">
        <div className="text-4xl mb-4">🧠</div>
        <h1 className="text-2xl font-bold text-indigo-900 mb-2">AI Analysis</h1>
        <p className="text-indigo-600">
          The robots are currently crunching the Rock, Paper, Scissors data...
        </p>
        <div className="mt-6 inline-block animate-pulse bg-indigo-200 h-2 w-32 rounded-full"></div>
      </div>
    </div>
  )
}
