# Move Priority

**Currently under development, so use it at your own risk**

This library attaches event listeners to an element and does some calculations,
to support drag and drop and gesture interactions.
However, the main purpose is, to detect if such an interaction
already happens inside the element and then reject the one with less priority.

I'm aware that it would be common, to achieve this by calling `event.stopPropagation()`.
However, I was in the situation, that it had to be done very often.
For example, if you have pages, you can swipe between them and the content can be arbitrary.
So also drag and drop, small games, anything else is possible
and not even done by yourself.

This library covers 90% of the cases
where to call `event.stopPropagation()`.
So it decides if an interaction makes sense,
then it does some calculations
and triggers registered callback functions.

If it doesn't work as excpected, you can still cancel the event the "old" way.

## Install

`npm install move-priority`

## Usage

As first parameter it expects an element or a selector like `.my-element.`
The second argument is an object with options, explained below

```js
import MovePriority from 'move-priority';

new MovePriority(document.querySelector('#element'), {
  onMove() {
    // Detected mousemove/pointermove inside the element.
    // There is no other interaction inside the element!
  },
});
```

### Options

#### mutationWhiteList

#### nativeStartMove

#### onStartMove

#### nativeMove

#### onMove

#### onEndMove

#### onCancelMove

#### onStopMove

### Useful Methods

#### diconnectObservation

#### connectObservation

#### destroy
