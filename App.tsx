import * as React from "react"

class Dependency {
	private listeners: Set<() => void> = new Set()
	public add(listener: () => void) {
		this.listeners.add(listener)
	}
	public remove(listener: () => void) {
		this.listeners.delete(listener)
	}
	// Emit an event and prevent circular dependencies.
	private emitting = false
	public emit = () => {
		if (this.emitting) {
			return
		}
		this.emitting = true
		this.listeners.forEach(listener => listener())
		this.emitting = false
	}
}

const contexts: Array<Set<Dependency>> = []

class Lens<State> {
	constructor(private state: State) {}
	private dependency = new Dependency()
	get(): State {
		const context = contexts[0]
		context && context.add(this.dependency)
		return this.state
	}
	set(state: State) {
		this.dependency.emit()
		this.state = state
	}
	prop(key: keyof State) {
		return new Lens(this.state[key])
	}
}

interface AppState {
	count: number
	delta: number
}

const appState = new Lens<AppState>({ count: 0, delta: 1 })

interface CounterProps {
	count: Lens<number>
}

export default class Counter extends React.Component<CounterProps> {
	private increment = () => {
		this.props.count.set(this.props.count.get() + 1)
	}

	private decrement = () => {
		this.props.count.set(this.props.count.get() - 1)
	}

	componentWillUnmount() {
		this.cleanup()
	}

	private dependencies = new Set<Dependency>()

	private update = () => this.forceUpdate()

	private cleanup() {
		this.dependencies.forEach(dependency => {
			dependency.remove(this.update)
		})
	}

	private reactive<T>(fn: () => T): T {
		this.cleanup()
		contexts.push(this.dependencies)
		const result = fn()
		this.dependencies.forEach(dependency => {
			dependency.add(this.update)
		})
		contexts.pop()
		return result
	}

	render() {
		return this.reactive(() => {
			return (
				<div>
					<button onClick={this.decrement}>{"-"}</button>
					<span>{this.props.count.get()}</span>
					<button onClick={this.increment}>{"+"}</button>
				</div>
			)
		})
	}
}
