import * as React from "react"
import * as _ from "lodash"

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
	constructor(private parent: { get(): State; set(newState: State): void }) {}
	private dependency = new Dependency()
	get(): State {
		const context = contexts[0]
		context && context.add(this.dependency)
		return this.parent.get()
	}
	set(newState: State) {
		this.dependency.emit()
		this.parent.set(newState)
	}
	private cache = new Map<number | string, Lens<any>>()
	prop(key: keyof State) {
		const cached = this.cache.get(key)
		if (cached) {
			return cached
		}
		const newLens = new Lens({
			get: () => this.parent.get()[key],
			set: newState => {
				const parentState = this.parent.get()
				if (_.isPlainObject(parentState)) {
					const newObject = {
						...(parentState as any), // TODO: better types
						[key]: newState,
					}
					this.parent.set(newObject)
				} else if (_.isArray(parentState)) {
					const newArray = [...parentState]
					newArray[key as any] = newState // TODO: better types
					this.parent.set(newArray as any) // TODO: better types
				} else {
					throw new Error("This shouldn't be possible.")
				}
			},
		})
		this.cache.set(key, newLens)
		return newLens
	}
}

function Reactive<T extends { new (...args: any[]): React.Component }>(
	constructor: T
) {
	return class extends constructor {
		componentWillUnmount() {
			this.cleanup()
			if (constructor.prototype.componentWillUnmount) {
				constructor.prototype.componentWillUnmount.call(this)
			}
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
				return constructor.prototype.render.call(this)
			})
		}
	}
}

interface CounterProps {
	label: string
	count: Lens<number>
	delta: number
}

@Reactive
class Counter extends React.Component<CounterProps> {
	private increment = () => {
		this.props.count.set(this.props.count.get() + this.props.delta)
	}

	private decrement = () => {
		this.props.count.set(this.props.count.get() - this.props.delta)
	}

	render() {
		console.log("Counter", this.props)
		return (
			<div>
				<span>{this.props.label}</span>
				<button onClick={this.decrement}>{"-"}</button>
				<span>{this.props.count.get()}</span>
				<button onClick={this.increment}>{"+"}</button>
			</div>
		)
	}
}

interface AppState {
	count: number
	delta: number
}

let _appState = { count: 0, delta: 1 }
const appState = new Lens<AppState>({
	get: () => _appState,
	set: newState => (_appState = newState),
})

@Reactive
class App extends React.Component {
	render() {
		console.log("App")
		return (
			<div>
				<Counter
					label={"count"}
					count={appState.prop("count")}
					delta={appState.prop("delta").get()}
				/>
				<Counter label={"delta"} count={appState.prop("delta")} delta={1} />
			</div>
		)
	}
}

export default App
