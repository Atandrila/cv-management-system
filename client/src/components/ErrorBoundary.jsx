import { Component } from "react";

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, details) {
    console.error("Page rendering failed:", error, details);
  }

  render() {
    if (!this.state.error) return this.props.children;
    return <main className="container py-5"><div className="alert alert-danger"><h1 className="h4">This page could not be displayed</h1><p>{this.state.error.message}</p><button className="btn btn-danger" onClick={() => window.location.reload()}>Reload page</button></div></main>;
  }
}
