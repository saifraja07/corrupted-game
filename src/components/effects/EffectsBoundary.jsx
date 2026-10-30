import { Component } from 'react'

// If a visual effect throws (e.g. an unsupported GPU feature), drop the effect and keep the game running.
export default class EffectsBoundary extends Component {
  state = { failed: false }
  static getDerivedStateFromError() {
    return { failed: true }
  }
  componentDidCatch(error) {
    console.warn('[effects] disabled after error:', error)
  }
  render() {
    return this.state.failed ? null : this.props.children
  }
}
