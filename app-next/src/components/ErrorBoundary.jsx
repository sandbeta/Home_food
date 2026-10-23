import { Component } from 'react'

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, info) {
    console.error('[lamb-kitchen]', error, info)
  }

  componentDidUpdate(prevProps) {
    if (this.state.error && prevProps.resetKey !== this.props.resetKey) {
      this.setState({ error: null })
    }
  }

  render() {
    if (!this.state.error) return this.props.children
    return (
      <div className="crash">
        <div className="crash__emoji" aria-hidden="true">🍳</div>
        <p className="t-title">锅端歪了</p>
        <p className="t-note">这一步没跑通，回去再试一次。</p>
        <button type="button" className="btn btn--primary" onClick={() => window.location.reload()}>
          重新点火
        </button>
      </div>
    )
  }
}
