// Helper v1.8
import * as PIXI from '../lib/Pixi/pixi-legacy.min.js' // https://pixijs.com
import Box2DFactory from '../lib/Box2D/entry.js' // https://github.com/Birch-san/box2d-wasm
import { } from '../lib/Howler/howler.min.js' // https://github.com/goldfire/howler.js
import { gsap } from '../lib/Gsap/gsap-core.min.js' // https://greensock.com/docs/v3/GSAP
import * as PARTICLES from '../lib/Pixi/particle-emitter.min.js' // https://particle-emitter-editor.pixijs.io  https://pixiparticles.com/pixijs-particle-emitter
import { PixiPlugin } from "../lib/Gsap/PixiPlugin.min.js"
import { CSSPlugin } from "../lib/Gsap/CSSPlugin.min.js"
import { CryptoJS } from '../lib/Crypto.js'
//import * as FILTERS from '../lib/Pixi/pixi-filters.js' // https://github.com/pixijs/filters

// config
Howler.autoUnlock = true
//PIXI.Ticker.targetFPMS = 0.06
//PIXI.BaseTexture.defaultOptions.mipmap = PIXI.MIPMAP_MODES.OFF
//PIXI.settings.ROUND_PIXELS = true

// register Gsap plugins
gsap.registerPlugin(PixiPlugin)
gsap.registerPlugin(CSSPlugin)
PixiPlugin.registerPIXI(PIXI)

// update PIXI.Assets.get
PIXI.Assets.get = function(name) {
  if (this.cache.has(name))
    return this.cache.get(name)
  else if (this.cache.has(name + '.png'))
    return this.cache.get(name + '.png')
  else if (this.cache.has(name + '.jpg'))
    return this.cache.get(name + '.jpg')
}

// disable right click
window.addEventListener('contextmenu', (e) => { e.preventDefault() })

// disable zoom on iOS
window.addEventListener('touchmove', (e) => {
  if (e.scale != undefined && e.scale !== 1) {
    e.preventDefault()
    e.stopImmediatePropagation()
  }
}, { passive: false })

// Actor
export class Actor extends PIXI.Sprite {
  constructor(name = '', x = 0, y = 0, image, onClick) {
    super(PIXI.Assets.get(image))

    this.name = name
    this.anchor.set(0.5)
    this.position.set(x, y)
    this.enabled = true
    /** @type {Box2D.b2Body} */ this.body

    // click
    if (onClick) {
      this.eventMode = 'static'
      this.on('pointertap', function(e) {
        if (e.pointerId != e.currentTarget.pointerId || !e.currentTarget.enabled) return // disabled or multitouch
        onClick(e.currentTarget)
      })
      this.on('pointerdown', function(e) { // disable multitouch
        if (e.isPrimary)
          e.currentTarget.pointerId = e.pointerId
      })
    }

    // remove
    this.on('removed', (e) => {
      this.clearAnimations().destroyBody()
      this.destroy()
    })
  }

  destroy(options) {
    if (!this.removed) {
      this.removed = true
      super.destroy(options)
    }
  }

  /** @returns {Number} */
  getIndex() {
    return this.parent.getChildIndex(this)
  }

  /** @param {Number} index */
  setIndex(index) {
    this.parent.setChildIndex(this, index)
  }

  toFront() {
    this.parent.setChildIndex(this, this.parent.children.length - 1)
  }

  toBack() {
    this.parent.setChildIndex(this, 0)
  }

  destroyBody() {
    if (this.body) {
      this.removeBody = true
      delete this.body
    }
  }

  /** Create gsap tween
   * @param {Object} params {pixi:{...}}, @param {Number} duration time in seconds, @param {String} ease easing, @param {Function} callback onComplete function */
  to(params, duration, ease, callback) {
    return new Tween(this).to(params, duration, ease, callback)
  }

  /** Create gsap tween
 * @param {Object} params {pixi:{...}}, @param {Number} duration time in seconds, @param {String} ease easing, @param {Function} callback onComplete function */
  from(params, duration, ease, callback) {
    return new Tween(this).to(params, duration, ease, callback)
  }

  /** @param {Number} duration time in seconds, @param {Function} callback onComplete function */
  delay(duration, callback) {
    return new Tween(this).delay(duration, callback)
  }

  clearAnimations() {
    gsap.killTweensOf(this)
    return this
  }
}

// AnimatedActor
export class AnimatedActor extends PIXI.AnimatedSprite {
  /** @param {Array<PIXI.Texture>} textures */
  constructor(name = '', x = 0, y = 0, textures, onClick) {
    super(textures)

    this.name = name
    this.anchor.set(0.5)
    this.position.set(x, y)
    this.enabled = true
    /** @type {Box2D.b2Body} */ this.body

    // click
    if (onClick) {
      this.eventMode = 'static'
      this.on('pointertap', function(e) {
        if (e.pointerId != e.currentTarget.pointerId || !e.currentTarget.enabled) return // disabled or multitouch
        onClick(e.currentTarget)
      })
      this.on('pointerdown', function(e) { // disable multitouch
        if (e.isPrimary)
          e.currentTarget.pointerId = e.pointerId
      })
    }

    // remove
    this.on('removed', (e) => {
      this.clearAnimations().destroyBody()
      this.destroy()
    })
  }

  destroy(options) {
    if (!this.removed) {
      this.removed = true
      super.destroy(options)
    }
  }

  /** @returns {Number} */
  getIndex() {
    return this.parent.getChildIndex(this)
  }

  /** @param {Number} index */
  setIndex(index) {
    this.parent.setChildIndex(this, index)
  }

  toFront() {
    this.parent.setChildIndex(this, this.parent.children.length - 1)
  }

  toBack() {
    this.parent.setChildIndex(this, 0)
  }

  destroyBody() {
    if (this.body) {
      this.removeBody = true
      delete this.body
    }
  }

  /** Create gsap tween
   * @param {Object} params {pixi:{...}}, @param {Number} duration time in seconds, @param {String} ease easing, @param {Function} callback onComplete function */
  to(params, duration, ease, callback) {
    return new Tween(this).to(params, duration, ease, callback)
  }

  /** Create gsap tween
 * @param {Object} params {pixi:{...}}, @param {Number} duration time in seconds, @param {String} ease easing, @param {Function} callback onComplete function */
  from(params, duration, ease, callback) {
    return new Tween(this).to(params, duration, ease, callback)
  }

  /** @param {Number} duration time in seconds, @param {Function} callback onComplete function */
  delay(duration, callback) {
    return new Tween(this).delay(duration, callback)
  }

  clearAnimations() {
    gsap.killTweensOf(this)
    return this
  }
}

// Group
export class Group extends PIXI.Container {
  constructor(onClick) {
    super()
    this.enabled = true

    // click
    if (onClick) {
      this.eventMode = 'static'
      this.on('pointertap', function(e) {
        if (e.pointerId != e.currentTarget.pointerId || !e.currentTarget.enabled) return // disabled or multitouch
        onClick(e.currentTarget)
      })
      this.on('pointerdown', function(e) { // disable multitouch
        if (e.isPrimary)
          e.currentTarget.pointerId = e.pointerId
      })
    }

    // remove
    this.on('removed', (e) => {
      this.clearAnimations()
      this.destroy()
    })
  }

  destroy(options) {
    if (!this.removed) {
      this.removed = true
      super.destroy(options)
    }
  }

  addParticleContainer(maxSize = 1000, updateTextures = false) {
    const container = new PIXI.ParticleContainer(maxSize, {
      vertices: true,
      position: true,
      rotation: true,
      uvs: updateTextures, // change texture on the fly
      tint: true
    })
    this.addChild(container)
    container.on('removed', (e) => container.destroy())
    return container
  }

  /** @param {Actor} actor, @param {Actor} actorAfter */
  addChildAfter(actor, actorAfter) {
    this.addChildAt(actor, this.getChildIndex(actorAfter) + 1)
  }

  /** @param {Actor} actor, @param {Actor} actorBefore */
  addChildBefore(actor, actorBefore) {
    this.addChildAt(actor, this.getChildIndex(actorBefore))
  }

  /** @param {String} name, @returns {Array<Actor|AnimatedActor>} */
  findChild(name) {
    const actors = []
    const children = this.children

    for (var i = 0; i < children.length; i++)
      if (children[i].name == name)
        actors.push(children[i])

    return actors
  }

  /** @returns {Number} */
  getIndex() {
    return this.parent.getChildIndex(this)
  }

  /** @param {Number} index */
  setIndex(index) {
    this.parent.setChildIndex(this, index)
  }

  toFront() {
    this.parent.setChildIndex(this, this.parent.children.length - 1)
  }

  toBack() {
    this.parent.setChildIndex(this, 0)
  }

  /** Create gsap tween
 * @param {Object} params {pixi:{...}}, @param {Number} duration time in seconds, @param {String} ease easing, @param {Function} callback onComplete function */
  to(params, duration, ease, callback) {
    return new Tween(this).to(params, duration, ease, callback)
  }

  /** Create gsap tween
 * @param {Object} params {pixi:{...}}, @param {Number} duration time in seconds, @param {String} ease easing, @param {Function} callback onComplete function */
  from(params, duration, ease, callback) {
    return new Tween(this).to(params, duration, ease, callback)
  }

  /** @param {Number} duration time in seconds, @param {Function} callback onComplete function */
  delay(duration, callback) {
    return new Tween(this).delay(duration, callback)
  }

  clearAnimations() {
    gsap.killTweensOf(this)
    return this
  }
}

// Tween
class Tween {
  /** @param {Actor} target */
  constructor(target) {
    this.target = target
    this.timeline = gsap.timeline()
    return this
  }

  /** Create gsap tween
   * @param {Object} params {pixi:{...}}, @param {Number} duration time in seconds, @param {String} ease easing, @param {Function} callback onComplete function */
  to(params, duration, ease = 'none', callback) {
    params = { pixi: params, ease: ease }
    if (callback != undefined)
      params.onComplete = () => callback(this.target)

    this.timeline.to(this.target, duration, params)
    return this
  }

  /** Create gsap tween
   * @param {Object} params {pixi:{...}}, @param {Number} duration time in seconds, @param {String} ease easing, @param {Function} callback onComplete function */
  from(params, duration, ease = 'none', callback) {
    params = { pixi: params, ease: ease }
    if (callback != undefined)
      params.onComplete = () => callback(this.target)

    this.timeline.from(this.target, duration, params)
    return this
  }

  /** @param {Number} duration time in seconds, @param {Function} callback onComplete function */
  delay(duration, callback) {
    this.timeline.to(this.target, duration, callback == undefined ? {} : { onComplete: () => callback(this.target) })
    return this
  }
}

// Storage
class Storage {
  constructor(appId) {
    this.appId = appId

    // data
    try {
      this.data = JSON.parse(CryptoJS.AES.decrypt(window.localStorage.getItem(this.appId), this.appId).toString(CryptoJS.enc.Utf8))
    }
    catch (e) {
      this.data = {}
    }
  }

  get(key, defaultValue) {
    return this.data[key] == undefined ? defaultValue : this.data[key]
  }

  set(key, value) {
    this.data[key] = value
    window.localStorage.setItem(this.appId, CryptoJS.AES.encrypt(JSON.stringify(this.data), this.appId).toString())
    return this
  }

  remove(key) {
    delete this.data[key]
    window.localStorage.setItem(this.appId, CryptoJS.AES.encrypt(JSON.stringify(this.data), this.appId).toString())
    return this
  }

  clear() {
    this.data = {}
    window.localStorage.removeItem(this.appId)
    return this
  }
}

// Helper
/** @param {String} APP_ID needed to save data to local storage */
export async function Helper(APP_ID, SCREEN_WIDTH, SCREEN_HEIGHT, BG_ALPHA, PPM, DEBUG, GRAVITY, onRender, onBeginContact, onEndContact, beforeContact, afterContact, onResize, onClick, loadScreen) {
  // const
  const
    CATEGORY_BITS = [1, 2, 4, 8, 16, 32, 64, 128, 256, 512, 1024, 2048, 4096, 8192, 16384, 32768], // category bits
    canvas = element('#canvas'),
    storage = new Storage(APP_ID),
    app = new PIXI.Application({ resolution: [1, 0.75, 0.5][storage.get('option-resolution', 0)], powerPreference: ['default', 'high-performance', 'low-power'][storage.get('option-power', 0)], antialias: storage.get('option-antialias', 0) == 1, backgroundAlpha: BG_ALPHA, view: canvas, width: SCREEN_WIDTH, height: SCREEN_HEIGHT }),
    box2d = await Box2DFactory(),
    webp = canvas.toDataURL('image/webp').indexOf('data:image/webp') == 0, // is browser support WebP
    assets = PIXI.Assets,
    sounds = [],
    pointLeftTop = new PIXI.Point(0, 0),
    pointRightTop = new PIXI.Point(SCREEN_WIDTH, 0),
    pointLeftBottom = new PIXI.Point(0, SCREEN_HEIGHT),
    pointRightBottom = new PIXI.Point(SCREEN_WIDTH, SCREEN_HEIGHT),
    memoryManager = new box2d.LeakMitigator(),
    bodiesActors = {},
    log = console.log

  // var
  var
    /** @type {Array<PARTICLES.Emitter>} */ emitters = [],
    currentWidth = document.body.offsetWidth,
    currentHeight = document.body.offsetHeight,
    intervalResize,
    screenCrop

  // assets folder
  await assets.init({ basePath: 'assets' })

  // contactListener
  const contactListener = new box2d.JSContactListener()
  contactListener.BeginContact = (contact) => {
    contact = box2d.wrapPointer(contact, box2d.b2Contact)
    onBeginContact(bodiesActors[box2d.getPointer(contact.GetFixtureA().GetBody())], bodiesActors[box2d.getPointer(contact.GetFixtureB().GetBody())], contact)
  }
  contactListener.EndContact = (contact) => {
    contact = box2d.wrapPointer(contact, box2d.b2Contact)
    onEndContact(bodiesActors[box2d.getPointer(contact.GetFixtureA().GetBody())], bodiesActors[box2d.getPointer(contact.GetFixtureB().GetBody())], contact)
  }
  contactListener.PreSolve = (contact, oldManifold) => {
    contact = box2d.wrapPointer(contact, box2d.b2Contact)
    oldManifold = box2d.wrapPointer(oldManifold, box2d.b2Manifold)
    beforeContact(bodiesActors[box2d.getPointer(contact.GetFixtureA().GetBody())], bodiesActors[box2d.getPointer(contact.GetFixtureB().GetBody())], contact, oldManifold)
  }
  contactListener.PostSolve = (contact, impulse) => {
    contact = box2d.wrapPointer(contact, box2d.b2Contact)
    impulse = box2d.wrapPointer(impulse, box2d.b2ContactImpulse)
    afterContact(bodiesActors[box2d.getPointer(contact.GetFixtureA().GetBody())], bodiesActors[box2d.getPointer(contact.GetFixtureB().GetBody())], contact, impulse)
  }

  // world
  const world = new box2d.b2World(new box2d.b2Vec2(GRAVITY.x, GRAVITY.y))
  world.SetContactListener(contactListener)

  // back
  const back = new PIXI.ParticleContainer(500, {
    vertices: true,
    position: true,
    rotation: true,
    uvs: false, // change texture on the fly
    tint: true
  })
  app.stage.addChild(back)

  // stage
  const stage = new PIXI.ParticleContainer(1000, {
    vertices: true,
    position: true,
    rotation: true,
    uvs: false, // change texture on the fly
    tint: true
  })
  stage.leftLimit = 0
  app.stage.addChild(stage)

  // debug
  if (DEBUG) {
    DEBUG = new PIXI.Graphics()
    app.stage.addChild(DEBUG)
    world.SetDebugDraw(debugDraw(DEBUG))
  }

  // front
  const front = new Group()
  app.stage.addChild(front)

  // sound
  Howler.mute(storage.get('mute', 0))

  // resize
  window.addEventListener('resize', (e) => {
    clearInterval(intervalResize)
    intervalResize = setInterval(function() {
      if (document.body.offsetWidth != currentWidth || document.body.offsetHeight != currentHeight) {
        clearInterval(intervalResize)
        currentWidth = document.body.offsetWidth
        currentHeight = document.body.offsetHeight
        resize()
      }
    }, PIXI.isMobile.any ? 100 : 10)
  })
  resize()

  // focus window
  document.addEventListener('visibilitychange', function(e) {
    if (document.visibilityState == 'hidden')
      pause(true, false)
    else if (!element('#pause') || element('#pause').style.opacity == 0)
      pause(false, false)
    // Howler.mute(storage.get('mute', 0) || document.visibilityState == 'hidden' || !app.ticker.started) // only sounds
  })

  // btnSound
  const btnSound = element('#btnSound')
  if (btnSound) {
    element('#btnSound img').src = storage.get('mute', 0) ? 'images/mute.svg' : 'images/sound.svg'
    btnSound.addEventListener('click', (e) => {
      if (storage.get('mute', 0)) { // sound
        storage.remove('mute')
        Howler.mute(!app.ticker.started)
        element('#btnSound img').src = 'images/sound.svg'
      } else { // mute
        storage.set('mute', 1)
        Howler.mute(true)
        element('#btnSound img').src = 'images/mute.svg'
      }
    })
  }

  // btnScreen
  const btnScreen = element('#btnScreen')
  if (hasFullscreen()) {
    btnScreen.addEventListener('click', (e) => {
      if (isFullscreen())
        exitFullscreen()
      else
        goFullscreen()
    })
  } else btnScreen.remove()

  // btnPause
  const btnPause = element('#btnPause')
  if (btnPause)
    btnPause.addEventListener('click', (e) => {
      if (Number(e.currentTarget.style.opacity) == 1)
        pause()
    })

  // btnBack
  const btnBack = element('#btnBack')
  if (btnBack)
    btnBack.addEventListener('click', (e) => {
      if (Number(e.currentTarget.style.opacity) == 1) {
        hide('#btnBack, #btnPause', 0.2)
        loadScreen('main')
      }
    })

  // btnOptions
  const btnOptions = element('#btnOptions')
  if (btnOptions) {
    btnOptions.addEventListener('click', (e) => {
      if (Number(e.currentTarget.style.opacity) == 1)
        show('#options', 0.2)
    })

    // load options
    const optionItems = elements('#options input')
    for (var i = 0; i < optionItems.length; i++)
      optionItems[i].checked = Number(optionItems[i].value) == storage.get(optionItems[i].name, 0)

    // save options
    element('#options .button').addEventListener('click', (e) => {
      const options = {}
      const optionItems = elements('#options input')

      // make data
      for (var i = 0; i < optionItems.length; i++) {
        if (options[optionItems[i].name] == undefined)
          options[optionItems[i].name] = 0
        if (optionItems[i].checked)
          options[optionItems[i].name] = Number(optionItems[i].value)
      }

      // save
      var someChanged = false
      for (var key in options) {
        if (storage.get(key, 0) != options[key] && (key == 'option-power' || key == 'option-resolution' || key == 'option-antialias'))
          someChanged = true
        storage.set(key, options[key])
      }

      // hide modal or reload
      if (someChanged)
        document.location = document.location
      else
        hide('#options', 0.2)
    })
  }

  // add renderer
  app.ticker.add(render)

  // load
  async function load(data, onLoaded) {
    const progressElement = element('#loader-progress')
    const maxProgress = Number(progressElement.getAttribute('stroke-dasharray'))
    const total = (data.assets ? data.assets.length : 0) + (data.sounds ? data.sounds.length : 0)
    var loaded = 0

    // reset
    gsap.killTweensOf('#loader, #loader-progress')
    progressElement.setAttribute('stroke', 'transparent')
    gsap.to(progressElement, 0, { strokeDashoffset: maxProgress })
    gsap.to('#loader img', 0, { scale: 1 })
    gsap.to('#loader', 0.2, { scale: 1, autoAlpha: 1 })

    // assets
    if (data.assets) {
      element('#loader-status').innerHTML = 'Loading textures'
      await assets.load(data.assets, function(progress) {
        loaded = Math.round(data.assets.length * progress)
        showProgress(Math.floor(loaded / total * 100)) // show progress
      })
    }

    // sounds
    if (data.sounds) {
      element('#loader-status').innerHTML = 'Loading sounds'
      const folder = 'sounds'
      const formats = ['mp3']

      for (var i = 0; i < data.sounds.length; i++) {
        const src = data.sounds[i].src
        const gap = data.sounds[i].gap || null
        delete data.sounds[i].gap

        // formats
        const files = []
        for (var j = 0; j < formats.length; j++)
          files.push(folder + '/' + src + '.' + formats[j])

        data.sounds[i].src = files
        sounds[src] = new Howl(data.sounds[i]).once('load', function() { // loaded
          // type
          const type = this._src.split('.')
          this.type = type[type.length - 1].toLowerCase()
          loaded++
          showProgress(Math.floor(loaded / total * 100)) // show progress
        }).once('loaderror', function() { // loading error
          delete sounds[this.id]
          this.unload()
          loaded++
          showProgress(Math.floor(loaded / total * 100)) // show progress
        })
        sounds[src].id = src

        // gap
        if (gap)
          sounds[src].gap = gap
      }
    }

    // showProgress
    function showProgress(percent) {
      gsap.killTweensOf(progressElement)
      progressElement.setAttribute('stroke', 'var(--color1)')
      gsap.to(progressElement, 0.2, {
        strokeDashoffset: maxProgress * ((100 - percent) / 100), onComplete: function() {
          // hide loader
          if (loaded == total) {
            element('#loader-status').innerHTML = '&nbsp;'
            gsap.killTweensOf('#loader')
            gsap.to('#loader img', 0.2, { scale: 0.5 })
            gsap.to('#loader', 0.2, {
              scale: 1.2, autoAlpha: 0, onComplete: function() {
                onLoaded()
              }
            })
          }
        }
      })
    }
  }

  // resize
  function resize() {
    // crop or fit screen
    screenCrop = (SCREEN_WIDTH > SCREEN_HEIGHT && document.body.offsetWidth / document.body.offsetHeight > SCREEN_WIDTH / SCREEN_HEIGHT) || (SCREEN_HEIGHT > SCREEN_WIDTH && document.body.offsetHeight / document.body.offsetWidth > SCREEN_HEIGHT / SCREEN_WIDTH) || PIXI.isMobile.any

    // count scale
    var scaleX = 1, scaleY = 1
    if (screenCrop) { // crop
      if (document.body.offsetWidth / document.body.offsetHeight < SCREEN_WIDTH / SCREEN_HEIGHT)
        scaleX = SCREEN_WIDTH / SCREEN_HEIGHT / (document.body.offsetWidth / document.body.offsetHeight)
      if (document.body.offsetHeight / document.body.offsetWidth < SCREEN_HEIGHT / SCREEN_WIDTH)
        scaleY = SCREEN_HEIGHT / SCREEN_WIDTH / (document.body.offsetHeight / document.body.offsetWidth)
    }
    else // fit
      if (document.body.offsetWidth / document.body.offsetHeight < SCREEN_WIDTH / SCREEN_HEIGHT)
        scaleY = SCREEN_HEIGHT / SCREEN_WIDTH / (document.body.offsetHeight / document.body.offsetWidth)
      else
        scaleX = SCREEN_WIDTH / SCREEN_HEIGHT / (document.body.offsetWidth / document.body.offsetHeight)

    // canvas size & position
    const width = Math.ceil(document.body.offsetWidth * scaleX)
    const height = Math.ceil(document.body.offsetHeight * scaleY)
    const left = Math.round((document.body.offsetWidth - width) / 2)
    const top = Math.round((document.body.offsetHeight - height) / 2)
    canvas.style.width = width + 'px'
    canvas.style.height = height + 'px'
    canvas.style.left = left + 'px'
    canvas.style.top = top + 'px'

    // header size & position
    const header = element('#header')
    const headerWidth = Math.min(width, document.body.offsetWidth)
    header.style.width = Math.max(headerWidth, 350) + 'px'
    header.style.left = (document.body.offsetWidth - header.offsetWidth) / 2 + 'px'
    header.style.top = Math.max(top, 0) + 'px'
    header.style.transform = headerWidth < 350 ? 'scale(' + headerWidth / 350 + ')' : 'none'

    // message
    element('#message-container').style.bottom = Math.floor(Math.max((document.body.offsetHeight - height) / 2, 0)) + 'px'

    // points
    if (screenCrop) { // crop
      pointLeftTop.set(-left * SCREEN_WIDTH / width, -top * SCREEN_HEIGHT / height)
      pointRightTop.set((width + left) * SCREEN_WIDTH / width, pointLeftTop.y)
      pointLeftBottom.set(pointLeftTop.x, (height + top) * SCREEN_HEIGHT / height)
    }
    else { // fit
      pointLeftTop.set(0, 0)
      pointRightTop.set(SCREEN_WIDTH, pointLeftTop.y)
      pointLeftBottom.set(pointLeftTop.x, SCREEN_HEIGHT)
    }
    pointRightBottom.set(pointRightTop.x, pointLeftBottom.y)

    // check screen orientation
    if (PIXI.isMobile.any && element('#orientation'))
      if ((SCREEN_WIDTH > SCREEN_HEIGHT && document.body.offsetWidth < document.body.offsetHeight) || (SCREEN_WIDTH < SCREEN_HEIGHT && document.body.offsetWidth > document.body.offsetHeight))
        show('#orientation')
      else
        hide('#orientation')

    // screen button
    if (hasFullscreen)
      element('#btnScreen img').src = isFullscreen() ? 'images/screen.svg' : 'images/fullscreen.svg'

    onResize()
  }

  // render
  function render(delta) {
    // world step
    world.Step(1 / 30 * delta, 6, 4) // 1 / 30, 3, 2 - default
    if (DEBUG) {
      DEBUG.clear()
      world.DebugDraw()
    }

    // each body
    for (var body = memoryManager.recordLeak(world.GetBodyList()); box2d.getPointer(body) !== box2d.getPointer(box2d.NULL); body = memoryManager.recordLeak(body.GetNext())) {
      const pointer = box2d.getPointer(body)
      const actor = bodiesActors[pointer]

      if (actor.removeBody) { // destroy body
        delete actor.removeBody
        delete bodiesActors[pointer]
        world.DestroyBody(pointer)
      }
      else { // actor position
        actor.x = body.GetPosition().x * PPM
        actor.y = body.GetPosition().y * PPM
        actor.rotation = body.GetAngle()
      }
    }

    memoryManager.freeLeaked() // clear JS cache
    onRender(delta)
  }

  // clearScreen
  function clearScreen(onClear) {
    // disable all bodies
    for (var body = memoryManager.recordLeak(world.GetBodyList()); box2d.getPointer(body) !== box2d.getPointer(box2d.NULL); body = memoryManager.recordLeak(body.GetNext()))
      body.SetEnabled(false)

    // clear emitters
    for (var i = 0; i < emitters.length; i++)
      emitters[i].destroy()
    emitters = []

    // clear pause
    app.ticker.start()

    // clear animations
    gsap.globalTimeline.clear().play()

    // clear stage
    back.removeChildren()
    stage.removeChildren()
    front.removeChildren()

    // delay until world cleared
    if (world.GetBodyCount() > 0) {
      setTimeout(clearScreen, 10, onClear)
      return
    }

    Howler.mute(storage.get('mute', 0)) // clear paused sounds
    cameraPosition()

    // hide message
    gsap.to('#message', 0, { bottom: -100 })

    // hide all
    hide(".modal[style*='opacity: 1'], #info, #btnBack, #btnPause, #btnOptions, #pause")

    // bg color
    app.renderer.background.color = '#000'
    app.renderer.background.alpha = BG_ALPHA

    // btnPause
    if (btnPause)
      element('#btnPause img').src = 'images/pause.svg'

    onClear()
  }

  // addLayer
  /** @returns {Array<Actor|AnimatedActor>} */
  function addLayer(name, map, container, isAnimated = false, left = 0, top = 0) {
    const actors = []

    // layers
    for (var i = 0; i < map.layers.length; i++) {
      const layer = map.layers[i]

      // if add only one layer
      if (name && layer.name != name)
        continue

      // objects
      for (var j = 0; j < layer.objects.length; j++) {
        const object = layer.objects[j]
        const image = object.image == undefined ? '' : map.images[object.image]

        // actor
        const actor = isAnimated ? new AnimatedActor(object.name ? object.name : layer.name, left + object.x, top + object.y, [assets.get(image)]) : new Actor(object.name ? object.name : layer.name, left + object.x, top + object.y, image)
        actor.scale.set(object.scale_x != undefined ? object.scale_x : 1, object.scale_y != undefined ? object.scale_y : 1)
        if (object.angle != undefined) actor.angle = object.angle
        if (object.alpha != undefined) actor.alpha = object.alpha
        if (object.touchable != undefined) {
          // click
          actor.eventMode = 'static'
          actor.on('pointertap', function(e) {
            if (e.pointerId != e.currentTarget.pointerId || !e.currentTarget.enabled) return // disabled or multitouch
            onClick(e.currentTarget)
          })

          // btn
          if (actor.name.startsWith('btn'))
            addButtonListeners(actor)
          else actor.on('pointerdown', function(e) { // disable multitouch
            if (e.isPrimary)
              e.currentTarget.pointerId = e.pointerId
          })
        }
        container.addChild(actor)
        actors.push(actor)

        // physics
        if (object.physics && object.shape_type) {
          // body def
          const bdef = new box2d.b2BodyDef()
          bdef.type = object.body_type == 'dynamic' ? box2d.b2_dynamicBody : (object.body_type == 'kinematic' ? box2d.b2_kinematicBody : box2d.b2_staticBody)
          bdef.position = new box2d.b2Vec2((left + object.x) / PPM, (top + object.y) / PPM)
          bdef.angle = toRadians(object.angle != undefined ? object.angle : 0)
          bdef.fixedRotation = object.fixed_rotation ? true : false

          // fixture def
          const fdef = new box2d.b2FixtureDef()
          fdef.density = object.density ? object.density : 0.01
          fdef.friction = object.friction ? object.friction : 0
          fdef.restitution = object.restitution ? object.restitution : 0
          fdef.isSensor = object.sensor ? true : false
          fdef.filter.categoryBits = CATEGORY_BITS[(object.category_bit ? object.category_bit : 1) - 1]

          // maskBits
          if (object.mask_bits) {
            fdef.filter.maskBits = 0
            for (var n = 0; n < object.mask_bits.length; n++)
              fdef.filter.maskBits += CATEGORY_BITS[object.mask_bits[n] - 1]
          }

          // body
          const body = memoryManager.recordLeak(world.CreateBody(bdef))
          body.SetLinearVelocity(new box2d.b2Vec2(object.velocity_x != undefined ? object.velocity_x : 0, object.velocity_y != undefined ? object.velocity_y : 0))
          actor.body = body
          bodiesActors[box2d.getPointer(body)] = actor

          // shape
          if (object.shape_separate) // multiple polygons
            for (var n = 0; n < object.shape_separate.length; n++) {
              var shape = new box2d.b2PolygonShape()
              var vertices = []
              for (var k = 0; k < object.shape_separate[n].length; k += 2)
                vertices.push(new box2d.b2Vec2(object.shape_separate[n][k] / PPM, object.shape_separate[n][k + 1] / PPM))
              shape.Set(convertVertices(vertices), vertices.length)
              fdef.shape = shape
              body.CreateFixture(fdef)
              box2d.destroy(shape)
            }
          else switch (object.shape_type) {
            case 'circle':
              var shape = new box2d.b2CircleShape()
              shape.m_radius = object.shape_values[2] / 2 / PPM
              shape.m_p = new box2d.b2Vec2(object.shape_values[0] / PPM, object.shape_values[1] / PPM)
              fdef.shape = shape
              body.CreateFixture(fdef)
              box2d.destroy(shape)
              break
            case 'rectangle':
              var shape = new box2d.b2PolygonShape()
              shape.SetAsBox(object.shape_values[2] / 2 / PPM, object.shape_values[3] / 2 / PPM, new box2d.b2Vec2(object.shape_values[0] / PPM, object.shape_values[1] / PPM), 0)
              fdef.shape = shape
              body.CreateFixture(fdef)
              box2d.destroy(shape)
              break
            case 'polygon':
              var shape = new box2d.b2PolygonShape()
              var vertices = []
              for (var k = 0; k < object.shape_values.length; k += 2)
                vertices.push(new box2d.b2Vec2(object.shape_values[k] / PPM, object.shape_values[k + 1] / PPM))
              shape.Set(convertVertices(vertices), vertices.length)
              fdef.shape = shape
              body.CreateFixture(fdef)
              box2d.destroy(shape)
              break
            case 'polyline':
              for (var k = 2; k < object.shape_values.length; k += 2) {
                var shape = new box2d.b2EdgeShape()
                shape.SetTwoSided(new box2d.b2Vec2(object.shape_values[k - 2] / PPM, object.shape_values[k - 1] / PPM), new box2d.b2Vec2(object.shape_values[k] / PPM, object.shape_values[k + 1] / PPM))
                fdef.shape = shape
                body.CreateFixture(fdef)
                box2d.destroy(shape)
              }
              break
          }

          box2d.destroy(bdef)
          box2d.destroy(fdef)
        }
      }

      // if add only one layer
      if (name && layer.name != name)
        break
    }

    return actors
  }

  // addGroup
  /** @param {Group} parent */
  function addGroup(name, map, container, addBg) {
    const group = new Group()
    container.addChild(group)

    if (addBg) {
      const bg = new PIXI.Graphics()
      bg.beginFill(0x000000)
      bg.drawRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT)
      bg.endFill()
      group.addChild(bg)
    }

    addLayer(name, map, group)
    return group
  }

  // sound
  function playSound(name) {
    if (sounds[name] && Howler.ctx.state === 'running') {
      const id = sounds[name].play()

      // gap
      if (sounds[name].type == 'mp3' && sounds[name].gap)
        sounds[name].seek(sounds[name].gap)

      return id
    }
  }

  // addButtonListeners
  /** @param {Actor} actor */
  function addButtonListeners(actor) {
    actor.cursor = 'pointer'
    actor.eventMode = 'static'

    // over
    actor.on('mouseover', function(e) {
      /** @type {Actor} */ const actor = e.currentTarget
      const color = new PIXI.ColorMatrixFilter()
      color.brightness(0.9)
      actor.filters = [color]
    })

    // out
    actor.on('mouseout', function(e) {
      /** @type {Actor} */ const actor = e.currentTarget
      const color = new PIXI.ColorMatrixFilter()
      color.brightness(1)
      actor.filters = [color]
    })

    // down
    actor.on('pointerdown', function(e) {
      if (e.isPrimary) // disable multitouch
        e.currentTarget.pointerId = e.pointerId
      else
        return

      // scale
      /** @type {Actor} */ const actor = e.currentTarget
      if (!gsap.isTweening(e.currentTarget))
        actor.prevScale = { x: actor.scale.x, y: actor.scale.y }
      actor.scale.set(actor.scale.x * 0.98, actor.scale.y * 0.98)

      playSound('btn')

      // brightness
      if (e.pointerType == 'touch') {
        const color = new PIXI.ColorMatrixFilter()
        color.brightness(0.9)
        actor.filters = [color]
      }
    })

    // up
    actor.on('pointerup', function(e) {
      if (e.pointerId != e.currentTarget.pointerId) return // disable multitouch

      // scale
      /** @type {Actor} */ const actor = e.currentTarget
      if (actor.prevScale && !gsap.isTweening(e.currentTarget))
        actor.scale.set(actor.prevScale.x, actor.prevScale.y)

      // brightness
      if (e.pointerType == 'touch') {
        const color = new PIXI.ColorMatrixFilter()
        color.brightness(1)
        actor.filters = [color]
      }
    })

    // up outside
    actor.on('pointerupoutside', function(e) {
      if (e.pointerId != e.currentTarget.pointerId) return // disable multitouch

      // scale
      /** @type {Actor} */ const actor = e.currentTarget
      if (actor.prevScale && !gsap.isTweening(e.currentTarget))
        actor.scale.set(actor.prevScale.x, actor.prevScale.y)

      // brightness
      if (e.pointerType == 'touch') {
        const color = new PIXI.ColorMatrixFilter()
        color.brightness(1)
        actor.filters = [color]
      }
    })
  }

  // addBox
  /** @param {String|Array<PIXI.Texture>} image */
  function addBox(name, image, container, width, height, x, y, angle, type, density, friction, restitution, isSensor, categoryBit, maskBits, onClick) {
    const actor = Array.isArray(image) ? new AnimatedActor(name, x, y, image, onClick) : new Actor(name, x, y, image, onClick)
    container.addChild(actor)

    const shape = new box2d.b2PolygonShape()
    shape.SetAsBox(width / 2 / PPM, height / 2 / PPM)
    const body = addBody([shape], x, y, angle, type, density, friction, restitution, isSensor, categoryBit, maskBits)

    actor.body = body
    bodiesActors[box2d.getPointer(body)] = actor
    return actor
  }

  // addCircle
  /** @param {String|Array<PIXI.Texture>} image */
  function addCircle(name, image, container, diameter, x, y, angle, type, density, friction, restitution, isSensor, categoryBit, maskBits, onClick) {
    const actor = Array.isArray(image) ? new AnimatedActor(name, x, y, image, onClick) : new Actor(name, x, y, image, onClick)
    container.addChild(actor)

    const shape = new box2d.b2CircleShape()
    shape.m_radius = diameter / 2 / PPM
    const body = addBody([shape], x, y, angle, type, density, friction, restitution, isSensor, categoryBit, maskBits)

    actor.body = body
    bodiesActors[box2d.getPointer(body)] = actor
    return actor
  }

  // addPolygon
  /** @param {String|Array<PIXI.Texture>} image */
  function addPolygon(name, image, container, points, x, y, angle, type, density, friction, restitution, isSensor, categoryBit, maskBits, onClick) {
    const actor = Array.isArray(image) ? new AnimatedActor(name, x, y, image, onClick) : new Actor(name, x, y, image, onClick)
    container.addChild(actor)

    const shape = new box2d.b2PolygonShape()
    const vertices = []
    for (var i = 0; i < points.length; i += 2)
      vertices.push(new box2d.b2Vec2(points[i] / PPM, points[i + 1] / PPM))
    shape.Set(convertVertices(vertices), vertices.length)
    const body = addBody([shape], x, y, angle, type, density, friction, restitution, isSensor, categoryBit, maskBits)

    actor.body = body
    bodiesActors[box2d.getPointer(body)] = actor
    return actor
  }

  // addPolyline
  /** @param {String|Array<PIXI.Texture>} image */
  function addPolyline(name, image, container, points, x, y, angle, type, density, friction, restitution, isSensor, categoryBit, maskBits, onClick) {
    const actor = Array.isArray(image) ? new AnimatedActor(name, x, y, image, onClick) : new Actor(name, x, y, image, onClick)
    container.addChild(actor)

    const shapes = []
    for (var i = 2; i < points.length; i += 2) {
      const shape = new box2d.b2EdgeShape()
      shape.SetTwoSided(new box2d.b2Vec2(points[i - 2] / PPM, points[i - 1] / PPM), new box2d.b2Vec2(points[i] / PPM, points[i + 1] / PPM))
      shapes.push(shape)
    }
    const body = addBody(shapes, x, y, angle, type, density, friction, restitution, isSensor, categoryBit, maskBits)

    actor.body = body
    bodiesActors[box2d.getPointer(body)] = actor
    return actor
  }

  // addBody
  function addBody(shapes, x = 0, y = 0, angle = 0, type = box2d.b2_staticBody, density = 0.01, friction = 0, restitution = 0, isSensor = false, categoryBit = 1, maskBits = 0) {
    // body def
    const bdef = new box2d.b2BodyDef()
    bdef.type = type
    bdef.position = new box2d.b2Vec2(x / PPM, y / PPM)
    bdef.angle = toRadians(angle)

    // fixture def
    const fdef = new box2d.b2FixtureDef()
    fdef.density = density
    fdef.friction = friction
    fdef.restitution = restitution
    fdef.isSensor = isSensor
    fdef.filter.categoryBits = CATEGORY_BITS[categoryBit - 1]

    // maskBits
    if (fdef.filter.maskBits != undefined)
      if (Array.isArray(maskBits)) {
        fdef.filter.maskBits = 0
        for (var i = 0; i < maskBits.length; i++)
          fdef.filter.maskBits += CATEGORY_BITS[maskBits[i] - 1]
      }
      else if (maskBits > 0)
        fdef.filter.maskBits = CATEGORY_BITS[maskBits - 1]

    // body
    const body = memoryManager.recordLeak(world.CreateBody(bdef))

    // shapes
    for (var i = 0; i < shapes.length; i++) {
      fdef.shape = shapes[i]
      body.CreateFixture(fdef)
      box2d.destroy(shapes[i])
    }

    box2d.destroy(bdef)
    box2d.destroy(fdef)
    return body
  }

  // addJoint
  function addJoint(jointDef, jointClass) {
    return box2d.wrapPointer(box2d.getPointer(memoryManager.recordLeak(world.CreateJoint(jointDef))), jointClass)
  }

  // convertVertices
  function convertVertices(vertices) {
    const buffer = box2d._malloc(vertices.length * 8)
    var offset = 0
    for (var i = 0; i < vertices.length; i++) {
      box2d.HEAPF32[buffer + offset >> 2] = vertices[i].get_x()
      box2d.HEAPF32[buffer + (offset + 4) >> 2] = vertices[i].get_y()
      offset += 8
    }
    return box2d.wrapPointer(buffer, box2d.b2Vec2)
  }

  // debugDraw
  function debugDraw(debugGraphics) {
    const debugDraw = new box2d.JSDraw()
    const e_shapeBit = 0x0001
    const e_jointBit = 0x0002
    const e_aabbBit = 0x0004
    const e_pairBit = 0x0008
    const e_centerOfMassBit = 0x0010
    debugDraw.SetFlags(e_shapeBit | e_jointBit)

    // DrawSegment
    debugDraw.DrawSegment = (vert1, vert2, color) => {
      const vert1V = box2d.wrapPointer(vert1, box2d.b2Vec2)
      const vert2V = box2d.wrapPointer(vert2, box2d.b2Vec2)
      debugGraphics.lineStyle(1, getColorFromDebugDrawCallback(color), 1)
      debugGraphics.moveTo(vert1V.get_x() * PPM, vert1V.get_y() * PPM)
      debugGraphics.lineTo(vert2V.get_x() * PPM, vert2V.get_y() * PPM)
      debugGraphics.endFill()
    }

    // DrawPolygon
    debugDraw.DrawPolygon = (vertices, vertexCount, color) => {
      debugGraphics.lineStyle(1, getColorFromDebugDrawCallback(color), 1)
      for (var i = 0; i < vertexCount; i++) {
        const vert = box2d.wrapPointer(vertices + (i * 8), box2d.b2Vec2)
        if (i === 0)
          debugGraphics.moveTo(vert.get_x() * PPM, vert.get_y() * PPM)
        else
          debugGraphics.lineTo(vert.get_x() * PPM, vert.get_y() * PPM)
      }
      debugGraphics.endFill()
    }

    // DrawSolidPolygon
    debugDraw.DrawSolidPolygon = (vertices, vertexCount, color) => {
      color = getColorFromDebugDrawCallback(color)
      debugGraphics.lineStyle(1, color, 1)
      debugGraphics.beginFill(color, 0.5)
      for (var i = 0; i < vertexCount; i++) {
        var vert = box2d.wrapPointer(vertices + (i * 8), box2d.b2Vec2)
        if (i === 0)
          debugGraphics.moveTo(vert.get_x() * PPM, vert.get_y() * PPM)
        else
          debugGraphics.lineTo(vert.get_x() * PPM, vert.get_y() * PPM)
      }

      // line to close path
      vert = box2d.wrapPointer(vertices, box2d.b2Vec2)
      debugGraphics.lineTo(vert.get_x() * PPM, vert.get_y() * PPM)

      debugGraphics.endFill()
    }

    // DrawCircle
    debugDraw.DrawCircle = (center, radius, color) => {
      const centerV = box2d.wrapPointer(center, box2d.b2Vec2)
      debugGraphics.lineStyle(1, getColorFromDebugDrawCallback(color), 1)
      debugGraphics.arc(centerV.get_x() * PPM, centerV.get_y() * PPM, radius * PPM, 0, 2 * Math.PI, false)
      debugGraphics.endFill()
    }

    // DrawSolidCircle
    debugDraw.DrawSolidCircle = (center, radius, axis, color) => {
      color = getColorFromDebugDrawCallback(color)
      const centerV = box2d.wrapPointer(center, box2d.b2Vec2)
      const axisV = box2d.wrapPointer(axis, box2d.b2Vec2)
      debugGraphics.lineStyle(1, color, 1)
      debugGraphics.beginFill(color, 0.5)
      debugGraphics.arc(centerV.get_x() * PPM, centerV.get_y() * PPM, radius * PPM, 0, 2 * Math.PI, false)

      const vert2V = new box2d.b2Vec2(centerV.get_x(), centerV.get_y())
      vert2V.op_add(new box2d.b2Vec2(axisV.get_x() * radius, axisV.get_y() * radius))
      debugGraphics.moveTo(centerV.get_x() * PPM, centerV.get_y() * PPM)
      debugGraphics.lineTo(vert2V.get_x() * PPM, vert2V.get_y() * PPM)

      debugGraphics.endFill()
      box2d.destroy(vert2V)
    }

    // DrawTransform
    debugDraw.DrawTransform = (transform) => {
      const trans = box2d.wrapPointer(transform, box2d.b2Transform)
      const x = trans.get_p().get_x()
      const y = trans.get_p().get_y()
      const angle = trans.get_q().GetAngle()

      // draw axes
      const sin = Math.sin(angle)
      const cos = Math.cos(angle)
      const newX = x * PPM
      const newY = y * PPM
      function transform(x, y) { return { x: x * cos + y * sin, y: -x * sin + y * cos } }
      const origin = transform(newX, newY)
      const xAxis = transform(newX + 100, newY)
      const yAxis = transform(newX, newY + 100)
      debugGraphics.lineStyle(2, 'rgb(192,0,0)', 1)
      debugGraphics.moveTo(origin.x, origin.y)
      debugGraphics.lineTo(xAxis.x, xAxis.y)
      debugGraphics.lineStyle(2, 'rgb(0,192,0)', 1)
      debugGraphics.moveTo(origin.x, origin.y)
      debugGraphics.lineTo(yAxis.x, yAxis.y)
      debugGraphics.endFill()
    }

    debugDraw.DrawPoint = (center, size, color) => {
      /*center = box2d.wrapPointer(center, box2d.b2Vec2)
      debugGraphics.lineStyle(1, color, 1)
      debugGraphics.beginFill(color, 1)
      debugGraphics.arc(center.get_x() * PPM, center.get_y() * PPM, size, 0, 2 * Math.PI, false)
      debugGraphics.endFill()*/
    }

    // getColorFromDebugDrawCallback
    function getColorFromDebugDrawCallback(color) {
      const col = box2d.wrapPointer(color, box2d.b2Color)
      const red = (col.get_r() * 255 * 255 * 255) | 0
      const green = (col.get_g() * 255 * 255) | 0
      const blue = (col.get_b() * 255) | 0
      return red + green + blue
    }

    return debugDraw
  }

  // toDegrees
  function toDegrees(radians) {
    return radians * 180 / Math.PI
  }

  // toRadians
  function toRadians(degrees) {
    return degrees * Math.PI / 180
  }

  // addEmitter
  function addEmitter(container, src, images, autoUpdate = true) {
    // check images
    for (var i = 0; i < images.length; i++) {
      if (!assets.cache.has(images[i]))
        if (assets.cache.has(images[i] + '.png'))
          images[i] += '.png'
        else if (assets.cache.has(images[i] + '.jpg'))
          images[i] += '.jpg'
    }

    // emitter
    const emitter = new PARTICLES.Emitter(container, PARTICLES.upgradeConfig(PIXI.Assets.get(src), images))
    emitter.autoUpdate = autoUpdate
    emitters.push(emitter)
    return emitter
  }

  // hasFullscreen
  function hasFullscreen() {
    return document.fullscreenEnabled || document.webkitFullscreenEnabled || document.mozFullScreenEnabled || document.msFullscreenEnabled
  }

  // isFullscreen
  function isFullscreen() {
    return document.fullscreenElement || document.webkitFullscreenElement || document.mozFullscreenElement || document.msFullscreenElement
  }

  // goFullscreen
  function goFullscreen() {
    if (document.fullscreenEnabled)
      document.documentElement.requestFullscreen()
    else if (document.webkitFullscreenEnabled)
      document.documentElement.webkitRequestFullscreen()
    else if (document.mozFullScreenEnabled)
      document.documentElement.mozRequestFullScreen()
    else if (document.msFullscreenEnabled)
      document.documentElement.msRequestFullscreen()
  }

  // exitFullscreen
  function exitFullscreen() {
    if (document.fullscreenEnabled)
      document.exitFullscreen()
    else if (document.webkitFullscreenEnabled)
      document.webkitExitFullscreen()
    else if (document.mozFullScreenEnabled)
      document.mozExitFullscreen()
    else if (document.msFullscreenEnabled)
      document.msExitFullscreen()
  }

  // debug
  function debug(...params) {
    var div = element('#debug')

    if (!div) { // create element
      div = document.createElement("div")
      div.id = 'debug'
      div.style.position = 'fixed'
      div.style.left = '0px'
      div.style.top = '0px'
      div.style.padding = '10px 25px 10px 10px'
      div.style.backgroundColor = '#FFF'
      div.style.fontFamily = 'Arial'
      div.style.fontSize = '12px'
      div.style.overflow = 'auto'
      div.style.width = '100%'
      div.style.borderBottom = '1px solid #000'
      div.style.maxHeight = '50%'
      div.style.overflowY = 'auto'
      div.style.boxSizing = 'border-box'
      div.style.whiteSpace = 'nowrap'
      div.addEventListener('click', (e) => {
        div.innerHTML = ''
        div.style.visibility = 'hidden'
      })
      document.body.append(div)
    }

    if (div.innerHTML != '')
      div.innerHTML += '<br><br>'
    div.style.visibility = 'visible'

    // params
    const existingKeys = []
    for (var i = 0; i < params.length; i++) {
      if (i != 0) div.innerHTML += ', '

      if (typeof params[i] == 'object') {
        div.innerHTML += '{'
        for (var key in params[i])
          div.innerHTML += '<br>"' + key + '": ' + (typeof params[i][key] == 'object' ? JSON.stringify(params[i][key], function(key, val) {
            if (val != null && typeof val == "object") {
              if (existingKeys.indexOf(val) >= 0)
                return
              existingKeys.push(val)
            }
            return val
          }) : params[i][key])
        div.innerHTML += '<br>}'
      }
      else
        div.innerHTML += params[i]
    }

    div.scrollTop = div.scrollHeight;
  }

  // hit
  function hit(name1, name2, actor1, actor2) {
    return (actor1.name == name1 && actor2.name == name2) || (actor2.name == name1 && actor1.name == name2)
  }

  // message
  function message(text, duration = 2) {
    const message = element('#message')
    gsap.killTweensOf(message)
    message.innerHTML = '<div>' + text + '</div>'
    gsap.fromTo(message, 0.5, { bottom: -100 }, { bottom: 0, yoyo: true, repeat: 1, repeatDelay: duration })
  }

  // cameraPosition
  function cameraPosition(x = SCREEN_WIDTH / 2, y = SCREEN_HEIGHT / 2, mapWidth = SCREEN_WIDTH, mapHeight = SCREEN_HEIGHT, leftLimit = 0, angle = 0, duration = 0) {
    // limit
    if (screenCrop) {
      const scaleX = SCREEN_WIDTH / canvas.offsetWidth, scaleY = SCREEN_HEIGHT / canvas.offsetHeight

      if (x < (document.body.offsetWidth - canvas.offsetWidth) / 2 * scaleX + leftLimit + SCREEN_WIDTH / 2)
        x = (document.body.offsetWidth - canvas.offsetWidth) / 2 * scaleX + leftLimit + SCREEN_WIDTH / 2
      if (x > (canvas.offsetWidth - document.body.offsetWidth) / 2 * scaleX - SCREEN_WIDTH / 2 + mapWidth)
        x = (canvas.offsetWidth - document.body.offsetWidth) / 2 * scaleX - SCREEN_WIDTH / 2 + mapWidth

      if (y < (document.body.offsetHeight - canvas.offsetHeight) / 2 * scaleY + SCREEN_HEIGHT / 2)
        y = (document.body.offsetHeight - canvas.offsetHeight) / 2 * scaleY + SCREEN_HEIGHT / 2
      if (y > (canvas.offsetHeight - document.body.offsetHeight) / 2 * scaleY - SCREEN_HEIGHT / 2 + mapHeight)
        y = (canvas.offsetHeight - document.body.offsetHeight) / 2 * scaleY - SCREEN_HEIGHT / 2 + mapHeight
    }
    else {
      if (x < leftLimit + SCREEN_WIDTH / 2)
        x = leftLimit + SCREEN_WIDTH / 2
      if (x > mapWidth - SCREEN_WIDTH / 2)
        x = mapWidth - SCREEN_WIDTH / 2

      if (y < SCREEN_HEIGHT / 2)
        y = SCREEN_HEIGHT / 2
      if (y > mapHeight - SCREEN_HEIGHT / 2)
        y = mapHeight - SCREEN_HEIGHT / 2
    }

    // stage
    if (duration == 0) {
      stage.position.set(SCREEN_WIDTH / 2, SCREEN_HEIGHT / 2)
      stage.pivot.set(x, y)
      stage.angle = angle
    } // animate
    else stage.to({ x: SCREEN_WIDTH / 2, y: SCREEN_HEIGHT / 2, angle: angle, pivotX: x, pivotY: y }, duration)

    // debug
    if (DEBUG)
      if (duration == 0) {
        DEBUG.position.set(SCREEN_WIDTH / 2, SCREEN_HEIGHT / 2)
        DEBUG.pivot.set(x, y)
        DEBUG.angle = angle
      }
      else { // animate
        gsap.to(DEBUG, duration, { x: SCREEN_WIDTH / 2, y: SCREEN_HEIGHT / 2, angle: angle })
        gsap.to(DEBUG.pivot, duration, { x: x, y: y })
      }
  }

  // pause
  function pause(state, buttonPressed = true) {
    if (state == undefined ? app.ticker.started : state) { // stop
      if (buttonPressed) {
        element('#btnPause img').src = 'images/play.svg'
        show('#pause')
      }
      app.ticker.stop()
      gsap.globalTimeline.pause()
      Howler.mute(true)
    }
    else { // start
      app.ticker.start()
      gsap.globalTimeline.play()
      if (buttonPressed) {
        element('#btnPause img').src = 'images/pause.svg'
        hide('#pause')
      }
      Howler.mute(storage.get('mute', 0))
    }
  }

  // show
  function show(selector, duration = 0, alpha = 1) {
    gsap.killTweensOf(selector)
    gsap.to(selector, duration, { autoAlpha: alpha })
  }

  // hide
  function hide(selector, duration = 0) {
    const items = elements(selector)
    if (items.length != 0) {
      gsap.killTweensOf(items)
      gsap.to(items, duration, { autoAlpha: 0 })
      return true
    }
  }

  /** @returns {HTMLElement} */
  function element(selector) {
    return document.querySelector(selector)
  }

  /** @returns {NodeListOf<HTMLElement>} */
  function elements(selector) {
    return document.querySelectorAll(selector)
  }

  return { app, stage, back, front, box2d, world, assets, sounds, storage, gsap, webp, pointLeftTop, pointRightTop, pointLeftBottom, pointRightBottom, CATEGORY_BITS, clearScreen, load, playSound, addLayer, addGroup, addBox, addCircle, addPolygon, addPolyline, addJoint, toDegrees, toRadians, addButtonListeners, addEmitter, hasFullscreen, isFullscreen, goFullscreen, exitFullscreen, debug, hit, cameraPosition, message, show, hide, log, element, elements }
}