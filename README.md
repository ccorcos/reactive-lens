# Reactive Lenses

The goal of this project is to combine the benefits of single-atom state with the convenience of reactive variables.

The idea is to uses lenses to query different parts of the global state and compute updates based on all downstream lenses.

Here's an example:

```ts
interface CounterProps {
	label: string
	count: Lens<number>
}

@Reactive
class Counter extends React.Component<CounterProps> {
	private increment = () => {
		this.props.count.set(this.props.count.get() + 1)
	}

	private decrement = () => {
		this.props.count.set(this.props.count.get() - 1)
	}

	render() {
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

// Top-level app state.
interface AppState {
	counter1: number
	counter2: number
}

let _appState = { count: 0, delta: 1 }
const appState = new Lens<AppState>({
	get: () => _appState,
	set: newState => (_appState = newState),
})

@Reactive
class App extends React.Component {
	render() {
		return (
			<div>
				<Counter label={"counter1"} count={appState.prop("counter1")}/>
				<Counter label={"counter2"} count={appState.prop("counter2")}/>
			</div>
		)
	}
}
```