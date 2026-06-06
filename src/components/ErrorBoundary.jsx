import { Component } from 'react'

export default class ErrorBoundary extends Component {
  state = { error: null }

  static getDerivedStateFromError(error) {
    return { error }
  }

  render() {
    if (this.state.error) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-8">
          <div className="bg-white rounded-2xl shadow-lg p-8 max-w-xl w-full">
            <div className="text-red-500 text-4xl mb-4">⚠️</div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Something went wrong</h2>
            <pre className="bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg p-4 overflow-auto whitespace-pre-wrap">
              {this.state.error.message}
              {'\n\n'}
              {this.state.error.stack}
            </pre>
            <button
              onClick={() => this.setState({ error: null })}
              className="mt-4 px-4 py-2 rounded-lg text-sm font-semibold text-white cursor-pointer"
              style={{ backgroundColor: '#6DC138' }}
            >
              Try again
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
