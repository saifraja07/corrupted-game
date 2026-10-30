import { Component } from 'react'

// Last line of defense around the 3D scene: if it crashes, show a message and a way back to the menu
// instead of a blank screen.
export default class GameErrorBoundary extends Component {
  state = { error: null }
  static getDerivedStateFromError(error) {
    return { error }
  }
  componentDidCatch(error) {
    console.error('[game] the 3D scene stopped unexpectedly:', error)
  }
  reset = () => {
    this.setState({ error: null })
    this.props.onReset?.()
  }
  render() {
    if (!this.state.error) return this.props.children
    return (
      <div role="alert" className="absolute inset-0 z-50 flex flex-col items-center justify-center gap-4 bg-zinc-100 px-6 text-center text-zinc-900">
        <h2 className="text-3xl font-bold">Something went wrong</h2>
        <p className="max-w-md text-zinc-600">The 3D scene stopped unexpectedly. Your progress is saved.</p>
        <button type="button" autoFocus onClick={this.reset} className="rounded border-2 border-zinc-900 px-6 py-2 font-semibold hover:bg-zinc-900 hover:text-zinc-100">
          Back to main menu
        </button>
      </div>
    )
  }
}
