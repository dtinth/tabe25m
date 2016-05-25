'use babel'

import { CompositeDisposable } from 'atom'

const TAKE_A_BREAK_EVERY = 25 * 60 * 1000
const TAKE_A_BREAK_FOR = 5 * 60 * 1000
const WARN_ME_BEFORE_BREAK_BY = 3 * 60 * 1000

function sideEffect (value, onChange) {
  return function (nextValue) {
    if (nextValue !== value) {
      value = nextValue
      onChange(value)
    }
  }
}

export default {
  config: {
    nextBreakTime: {
      type: 'integer',
      default: 0
    }
  },
  activate(state) {
    this.nextBreak = 0
    this.element = document.createElement('div')
    this.element.className = 'tabe25m-view'
    this.text = document.createElement('div')
    this.text.innerHTML = 'YOU SHOULD TAKE A BREAK'
    this.element.appendChild(this.text)
    this.subscriptions = new CompositeDisposable()
    this.interval = setInterval(() => this.checkTimer(), 1000)
    this.subscriptions.add(atom.workspace.observeTextEditors((textEditor) => {
      this.subscriptions.add(textEditor.onDidChange(() => this.triggerTextChange()))
    }))
    this.subscriptions.add(atom.config.observe('tabe25m.nextBreakTime', (value) => {
      this.nextBreak = value
    }))
    this.setHidden = sideEffect(false, (hidden) => {
      this.element.style.display = hidden ? 'none' : 'block'
    })
    this.setOpacity = sideEffect(1, (opacity) => {
      this.element.style.opacity = opacity
    })
    this.setText = sideEffect('', (text) => {
      this.text.innerHTML = text
    })
    this.checkTimer()
    document.body.appendChild(this.element)
  },
  triggerTextChange () {
    if (Date.now() > this.nextBreak + TAKE_A_BREAK_FOR) {
      this.nextBreak = Date.now() + TAKE_A_BREAK_EVERY
      atom.config.set('tabe25m.nextBreakTime', this.nextBreak)
    }
  },
  checkTimer () {
    const timeLeft = this.nextBreak - Date.now()
    if (timeLeft < 0) {
      const breakLeft = timeLeft + TAKE_A_BREAK_FOR
      if (breakLeft > 0) {
        this.setHidden(false)
        this.setOpacity(1)
        const minutes = Math.ceil(breakLeft / 60000)
        this.setText('YOU SHOULD TAKE A BREAK<br>' + minutes + ' MORE MINUTE' + (minutes === 1 ? '!' : 'S'))
      } else {
        this.setHidden(breakLeft < -2000)
        this.setOpacity(0)
      }
    } else if (timeLeft < WARN_ME_BEFORE_BREAK_BY) {
      const warnIntensity = 1 - (timeLeft / WARN_ME_BEFORE_BREAK_BY)
      this.setHidden(false)
      this.setOpacity(Math.pow(warnIntensity, 3))
      this.setText('GET READY TO TAKE A BREAK')
    } else {
      this.setHidden(true)
      this.setOpacity(0)
    }
  },
  deactivate() {
    this.element.parentNode.removeChild(this.element)
    this.subscriptions.dispose()
    clearInterval(this.interval)
  }
}
