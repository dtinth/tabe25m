'use babel'

import { CompositeDisposable } from 'atom'

const TAKE_A_BREAK_EVERY = 25 * 60 * 1000
const TAKE_A_BREAK_FOR = 5 * 60 * 1000
const MINUTE = 60 * 1000
const WARN_ME_BEFORE_BREAK_BY = 5 * 60 * 1000

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
    },
    workTime:{
      type: 'integer',
      default : 25
    },
    breakTime:{
      type: 'integer',
      default : 5
    },
    warnTime:{
      type : 'integer',
      default : 5
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
    this.subscriptions.add(atom.commands.add('atom-workspace', 'tabe25m:ima-desho', () => {
      this.nextBreak = Date.now()
      atom.config.set('tabe25m.nextBreakTime', this.nextBreak)
    }))
    this.setHidden = sideEffect(false, (hidden) => {
      this.element.style.display = hidden ? 'none' : 'block'
    })
    this.setOpacity = sideEffect(1, (opacity) => {
      this.element.style.opacity = Math.pow(opacity, 3)
    })
    this.setText = sideEffect('', (text) => {
      this.text.innerHTML = text
    })
    this.checkTimer()
    document.body.appendChild(this.element)
  },
  triggerTextChange () {
    if (Date.now() > this.nextBreak + atom.config.get('tabe25m.breakTime')*MINUTE) {
      this.nextBreak = Date.now() + atom.config.get('tabe25m.workTime')*MINUTE
      atom.config.set('tabe25m.nextBreakTime', this.nextBreak)
    }
  },
  checkTimer () {
    const timeLeft = this.nextBreak - Date.now()
    if (timeLeft < 0) {
      const breakLeft = timeLeft + atom.config.get('tabe25m.breakTime')*MINUTE
      if (breakLeft > 0) {
        this.setHidden(false)
        this.setOpacity(1)
        const minutes = Math.ceil(breakLeft / 60000)
        this.setText('YOU SHOULD TAKE A BREAK<br>' + minutes + ' MORE MINUTE' + (minutes === 1 ? '!' : 'S'))
      } else {
        this.setHidden(breakLeft < -2000)
        this.setOpacity(0)
      }
    } else if (timeLeft < atom.config.get('warnTime')*MINUTE) {
      const warnIntensity = 1 - (timeLeft / atom.config.get('warnTime')*MINUTE)
      this.setHidden(false)
      this.setOpacity(warnIntensity)
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
