// import
import * as PIXI from '../lib/Pixi/pixi-legacy.min.js' // https://pixijs.com
import * as PARTICLES from '../lib/Pixi/particle-emitter.min.js' // https://particle-emitter-editor.pixijs.io  https://pixiparticles.com/pixijs-particle-emitter
import { Helper, Actor } from './helper.js'

// Add this near the top of the file after imports
let web3;
let provider;

// Add these variables and functions at the top of your self-executing function
let userAddress = null;
let fundingEligible = false;
let nextEligibleTime = null;
let gameContract;
const CONTRACT_ADDRESS = '0xADF55831b2a2Ad1937974b10f77f4773855078b5';
const CONTRACT_ABI = [
  {
    "inputs": [],
    "name": "unlock",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
];

// Core DAO network configuration
// const CORE_CHAIN_ID = 1116; // Core DAO Mainnet
const CORE_NETWORK_CONFIG = {
  chainId: '0x45C', // 1116 in hex
  chainName: 'Core Blockchain Mainnet',
  nativeCurrency: {
    name: 'CORE',
    symbol: 'CORE',
    decimals: 18
  },
  rpcUrls: ['https://rpc.coredao.org'],
  blockExplorerUrls: ['https://scan.coredao.org']
};

(async () => {
  // const
  const
    SCREEN_WIDTH = 1920, // screen width
    SCREEN_HEIGHT = 1440, // screen height
    BG_ALPHA = 1, // background alpha
    GRAVITY = { x: 0, y: 10 }, // gravity
    PPM = 32, // pixel per meter for Box2D
    DEBUG = false, // debug
    ACCELERATION = 1000, // hero acceleration
    MAX_SPEED = 15, // hero max speed
    HERO_JUMP = 430, // hero jump power
    HERO_BACKFLIP = 1000, // hero backflip power
    HERO_FLIP = 1400, // hero flip power
    HERO_TURN = 1, // hero turn step
    PART_WIDTH = 3072, // map part width
    PARALAX = { x: 3, y: 3, ground: 700 } // background parallax effect

  // var
  var map, score, screen = '', showControls = true, keyLeft, keyRight, keyUp, onGround, currentPart, mapWidth,
  /** @type {Actor} */ controlLeft,
  /** @type {Actor} */ controlRight,
  /** @type {Actor} */ hero,
  /** @type {Actor} */ head,
  /** @type {Actor} */ ears,
  /** @type {Actor} */ eyes,
  /** @type {Actor} */ mouth,
  /** @type {Actor} */ legLeft,
  /** @type {Actor} */ legRight,
	/** @type {Actor} */ board,
	/** @type {Actor} */ tireLeft,
	/** @type {Actor} */ tireRight,
  /** @type {Actor} */ startLimit,
  /** @type {Array<Actor>} */ heroAll,
  /** @type {Array<Actor>} */ clouds,
  /** @type {Array<Actor>} */ bg0,
  /** @type {Array<Actor>} */ bg1,
  /** @type {Array<Actor>} */ bg2,
  /** @type {Array<Array<Actor>>} */ leftActors,
  /** @type {Array<Box2D.b2Joint>} */ heroJoints,
  /** @type {Box2D.b2RevoluteJoint} */ handLeftJoint,
  /** @type {Box2D.b2RevoluteJoint} */ handRightJoint,
  /** @type {Actor} */ txtScore,
  /** @type {Actor} */ txtJump,
  /** @type {Actor} */ txtBackFlip,
  /** @type {Actor} */ txtFlip,
  /** @type {PARTICLES.Emitter} */ emitter

  // helper
  const helper = await Helper('Skateboarder', SCREEN_WIDTH, SCREEN_HEIGHT, BG_ALPHA, PPM, DEBUG, GRAVITY, render, beginContact, endContact, beforeContact, afterContact, resize, click, loadScreen),
    { app, stage, back, front, box2d, world, assets, sounds, storage, gsap, playSound, hit, show, hide, log, element, elements } = helper

  // load
  helper.load({
    assets: [
      'atlas.json',
      'emitter.json'
    ],
    sounds: [
      { src: 'sndBg', volume: 0.2, autoplay: true, loop: true },
      { src: 'btn', volume: 1 },
      { src: 'sndBox', volume: 0.9 },
      { src: 'sndBulk0', volume: 0.5 },
      { src: 'sndBulk1', volume: 0.5 },
      { src: 'sndBulk2', volume: 0.5 },
      { src: 'sndDie', volume: 1 },
      { src: 'sndFall0', volume: 0.8 },
      { src: 'sndFall1', volume: 0.8 },
      { src: 'sndGameOver', volume: 0.6 },
      { src: 'sndHouse', volume: 1 },
      { src: 'sndJump', volume: 0.7 },
      { src: 'sndMetal0', volume: 0.8 },
      { src: 'sndMetal1', volume: 0.8 },
      { src: 'sndPipe0', volume: 0.7 },
      { src: 'sndPipe1', volume: 0.7 },
      { src: 'sndSpring', volume: 0.5 },
      { src: 'sndStone0', volume: 0.7 },
      { src: 'sndStone1', volume: 0.7 },
      { src: 'sndCake', volume: 0.5 },
      { src: 'sndUh', volume: 0.6 },
      { src: 'sndGround', volume: 1 },
      { src: 'sndRecord', volume: 0.5 }
    ]
  }, async function () { // after loaded
    element('#loader').remove()
    start()
  })

  // start
  function start() {
    key()
    loadScreen('main')
  }

  // Function to check and switch to Core DAO network
  async function ensureCoreNetwork() {
    if (!window.ethereum) {
      helper.message('Please install MetaMask to connect to Core DAO');
      return false;
    }
    
    try {
      const chainId = await window.ethereum.request({ method: 'eth_chainId' });
      
      if (chainId !== CORE_NETWORK_CONFIG.chainId) {
        helper.message('Switching to Core DAO network...');
        
        try {
          // Try to switch to Core DAO
          await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: CORE_NETWORK_CONFIG.chainId }]
          });
          return true;
        } catch (switchError) {
          // If the network is not added to MetaMask, add it
          if (switchError.code === 4902) {
            try {
              await window.ethereum.request({
                method: 'wallet_addEthereumChain',
                params: [CORE_NETWORK_CONFIG]
              });
              return true;
            } catch (addError) {
              console.error('Error adding Core DAO network:', addError);
              helper.message('Failed to add Core DAO network. Please add it manually in your wallet.');
              return false;
            }
          } else {
            console.error('Error switching to Core DAO network:', switchError);
            helper.message('Please switch to Core DAO network in your wallet.');
            return false;
          }
        }
      }
      
      return true; // Already on Core DAO network
    } catch (error) {
      console.error('Error checking network:', error);
      helper.message('Error checking network. Please make sure you are connected to Core DAO.');
      return false;
    }
  }

  // Connect wallet function
  async function connectWallet() {
    try {
      if (window.ethereum) {
        // First request accounts
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        
        // Ensure we're on Core DAO network
        const onCoreNetwork = await ensureCoreNetwork();
        if (!onCoreNetwork) {
          return null;
        }
        
        if (accounts && accounts.length > 0) {
          return accounts[0];
        }
      } else {
        helper.message('Please install MetaMask to connect your wallet');
      }
      return null;
    } catch (error) {
      console.error('Error connecting wallet:', error);
      return null;
    }
  }

  // Check funding eligibility
  async function checkFundingEligibility(address) {
    try {
      const response = await fetch(`https://iioaqqy4sd.execute-api.us-east-1.amazonaws.com/production/faucet/check/${address}`);
      const result = await response.json();
      console.log('Eligibility check response:', result);
      
      if (result && result.status === 'success' && result.data) {
        fundingEligible = result.data.eligible;
        nextEligibleTime = result.data.nextEligibleTime || null;
        return {
          eligible: result.data.eligible,
          nextEligibleTime: result.data.nextEligibleTime,
          message: result.data.message
        };
      }
      return { eligible: false };
    } catch (error) {
      console.error('Error checking funding eligibility:', error);
      return { eligible: false };
    }
  }

  // Fund wallet function
  async function fundWallet(address) {
    try {
      const response = await fetch('https://iioaqqy4sd.execute-api.us-east-1.amazonaws.com/production/faucet', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ address })
      });
      
      const data = await response.json();
      console.log('Funding response:', data);
      
      if (data && data.success) {
        helper.message('Wallet funded successfully!');
        await checkFundingEligibility(address);
        return true;
      } else {
        helper.message(data.message || 'Funding failed. Try again later.');
        return false;
      }
    } catch (error) {
      console.error('Error funding wallet:', error);
      helper.message('Error funding wallet. Try again later.');
      return false;
    }
  }

  // loadScreen
  function loadScreen(newScreen) {
    keyLeft = false
    keyRight = false
    keyUp = false
    onGround = 0
    hero = null
    controlLeft = null
    controlRight = null
    score = 0
    clouds = []
    bg0 = []
    bg1 = []
    bg2 = []
    heroJoints = []
    leftActors = {}
    currentPart = 0
    mapWidth = 0
    sounds['sndGameOver'].stop()

    // clear screen
    screen = ''
    helper.clearScreen(async function () {
      // load map
      map = await (await fetch('assets/map_' + newScreen + '.hmp')).json()

      // bg color
      app.renderer.background.color = map.map_color
      app.renderer.background.alpha = BG_ALPHA

      // screen
      switch (newScreen) {
        case 'main':
          showMain()
          break
        case 'game':
          showGame()
          break
      }

      screen = newScreen
      resize()
    })
  }

  // showMain
  function showMain() {
    // sky
    const sky = new Actor('sky', SCREEN_WIDTH / 2, 300, 'sky' + Math.round(Math.random() * 2))
    sky.scale.x = 40
    stage.addChild(sky)

    // clouds
    clouds = helper.addLayer('cloud', map, stage)
    if (Math.random() > 0.5)
      clouds.reverse()
    for (var i = 0; i < clouds.length; i++) {
      clouds[i].x = SCREEN_WIDTH / 2 * i + Math.random() * SCREEN_WIDTH / 2
      clouds[i].speed = 0.2 + Math.random() * 0.5
    }

    // bg0
    var tex = assets.get('bg0')
    for (var i = 0; i < Math.ceil(SCREEN_WIDTH / tex.width) + 1; i++) {
      const actor = new Actor('', tex.width * i, 500, 'bg0')
      actor.startY = actor.y
      actor.width += 0.5
      stage.addChild(actor)
      bg0.push(actor)
    }

    // bg1
    tex = assets.get('bg1')
    for (var i = 0; i < Math.ceil(SCREEN_WIDTH / tex.width) + 1; i++) {
      const actor = new Actor('', tex.width * i, 950, 'bg1')
      actor.startY = actor.y
      actor.width += 0.5
      stage.addChild(actor)
      bg1.push(actor)
    }

    // bg2
    tex = assets.get('bg2')
    for (var i = 0; i < Math.ceil(SCREEN_WIDTH / tex.width) + 1; i++) {
      const actor = new Actor('', tex.width * i, 1300, 'bg2')
      actor.startY = actor.y
      actor.width += 0.5
      stage.addChild(actor)
      bg2.push(actor)
    }

    // score
    var actors = helper.addLayer('score', map, front)

    // add score
    const scoreValue = storage.get('score', 0) + ''
    const numbers = []
    var w = 0
    for (var i = 0; i < scoreValue.length; i++) {
      const actor = new Actor('', 0, 510, scoreValue.substring(i, i + 1))
      numbers.push(actor)
      actors.push(actor)
      front.addChild(actor)
      w += actor.width
    }

    // set score position
    var x = (SCREEN_WIDTH - w) / 2
    for (var i = 0; i < numbers.length; i++) {
      numbers[i].x = x + numbers[i].width / 2
      x += numbers[i].width
    }

    // animate elements
    const animSpeed = 0.3
    for (var i = 0; i < actors.length; i++) {
      actors[i].toFront()
      actors[i].alpha = 0
      actors[i].scale.set(1.5)
      actors[i].delay(0.2 + i * animSpeed * 0.5).to({ alpha: 1, scale: 1 }, animSpeed, 'back.out(4)')
    }

    // elements
    var actors = helper.addLayer('element', map, stage)
    for (var i = 0; i < actors.length; i++)
      if (actors[i].name == 'ground') {
        actors[i].width += 0.5
        actors[i].height += 0.5
      }

    // Add connect wallet button
    const btnWallet = new PIXI.Text('Connect Wallet', {
        fontFamily: 'Arial',
        fontSize: 36,
        fill: 0xFFFFFF,
        align: 'center',
        stroke: 0x000000,    // Add black outline
        strokeThickness: 4,   // Outline thickness
        dropShadow: true,    // Add drop shadow
        dropShadowColor: '#000000',
        dropShadowBlur: 4,
        dropShadowAngle: Math.PI / 6,
        dropShadowDistance: 6,
        enabled: true
    });
    btnWallet.name = 'btnWallet';
    btnWallet.anchor.set(0.5);
    // Position will be set in resize function
    btnWallet.eventMode = 'static';
    btnWallet.enabled = true;

    // Add fund wallet button
    const btnFund = new PIXI.Text('Connect Wallet First', {
        fontFamily: 'Arial',
        fontSize: 36,
        fill: 0x888888,
        align: 'center',
        stroke: 0x000000,
        strokeThickness: 4,
        dropShadow: true,
        dropShadowColor: '#000000',
        dropShadowBlur: 4,
        dropShadowAngle: Math.PI / 6,
        dropShadowDistance: 6,
        enabled: false
    });
    btnFund.name = 'btnFund';
    btnFund.anchor.set(0.5);
    // Position will be set in resize function
    btnFund.eventMode = 'static';
    btnFund.enabled = false;

    // Define the updateFundButton function
    function updateFundButton(eligibility) {
        if (!eligibility) return;
        
        if (eligibility.eligible) {
            btnFund.text = 'Fund Core Wallet';
            btnFund.enabled = true;
            btnFund.style.fill = 0xFFFFFF;
        } else {
            if (eligibility.nextEligibleTime) {
                const nextTime = new Date(eligibility.nextEligibleTime);
                const timeString = nextTime.toLocaleTimeString();
                btnFund.text = `Next Fund: ${timeString}`;
                btnFund.enabled = false;
                btnFund.style.fill = 0x888888;
            } else if (userAddress) {
                // If wallet is connected but not eligible (and no next time)
                btnFund.text = 'Check Core Eligibility';
                btnFund.enabled = true;
                btnFund.style.fill = 0xFFFFFF;
            } else {
                btnFund.text = 'Connect Core Wallet First';
                btnFund.enabled = false;
                btnFund.style.fill = 0x888888;
            }
        }
    }
    
    // Add wallet button event handler
    btnWallet.on('pointertap', async () => {
        if (!btnWallet.enabled) return;
        
        console.log('Wallet button clicked');
        try {
            btnWallet.text = 'Connecting to Core...';
            
            const account = await connectWallet();
            console.log('Wallet connection response:', account);
            
            if (account) {
                btnWallet.text = 'Core: ' + account.substr(0, 6) + '...';
                btnWallet.style.fill = 0x00FF00;
                helper.message('Core wallet connected: ' + account.substr(0, 6) + '...');
                
                userAddress = account;
                
                const eligibility = await checkFundingEligibility(account);
                updateFundButton(eligibility);
            } else {
                btnWallet.text = 'Connect Core Wallet';
                btnWallet.style.fill = 0xFFFFFF;
            }
        } catch (error) {
            console.error('Wallet connection error:', error);
            helper.message('Error connecting to Core network');
            btnWallet.text = 'Connect Core Wallet';
            btnWallet.style.fill = 0xFFFFFF;
        }
    });
    
    // Add fund button event handler
    btnFund.on('pointertap', async () => {
        if (!btnFund.enabled) return;
        
        if (userAddress) {
            console.log('Fund button clicked');
            
            if (!fundingEligible) {
                btnFund.text = 'Checking...';
                const eligibility = await checkFundingEligibility(userAddress);
                updateFundButton(eligibility);
                return;
            }
            
            btnFund.text = 'Funding...';
            btnFund.enabled = false;
            btnFund.style.fill = 0x888888;
            
            const success = await fundWallet(userAddress);
            
            if (success) {
                updateFundButton({ eligible: false, nextEligibleTime });
            } else {
                btnFund.text = 'Try Again';
                btnFund.enabled = true;
                btnFund.style.fill = 0xFFFFFF;
            }
        }
    });
    
    // Add hover effects
    btnWallet.on('pointerover', () => {
        if (btnWallet.enabled) btnWallet.scale.set(1.1);
    });
    btnWallet.on('pointerout', () => {
        btnWallet.scale.set(1.0);
    });
    
    btnFund.on('pointerover', () => {
        if (btnFund.enabled) btnFund.scale.set(1.1);
    });
    btnFund.on('pointerout', () => {
        btnFund.scale.set(1.0);
    });
    
    // Add buttons to the stage
    front.addChild(btnWallet);
    front.addChild(btnFund);
    
    // Store buttons in window object for access from resize function
    window.btnWallet = btnWallet;
    window.btnFund = btnFund;
    
    // Call resize to position the buttons correctly
    resize();

    // Modify btnStart to check for wallet connection and add logging
    const btnStart = helper.addLayer('btnStart', map, front)[0];
    btnStart.eventMode = 'static';
    btnStart.on('pointertap', async () => {
        console.log('Play button clicked');
        if (btnStart.enabled) {
            if (window.ethereum && window.ethereum.selectedAddress) {
                // Check if we're on Core DAO network
                const onCoreNetwork = await ensureCoreNetwork();
                if (!onCoreNetwork) {
                    return;
                }
                
                console.log('Starting game with wallet:', window.ethereum.selectedAddress);
                loadScreen('game');
            } else {
                console.log('Wallet not connected');
                helper.message('Please connect your wallet first!');
            }
        }
    });
    gsap.to(btnStart.scale, 0.5, { x: 1.05, y: 1.05, yoyo: true, repeat: -1, ease: 'none' });

    // hero
    addHero(front)
    for (var i = 0; i < heroAll.length; i++)
      if (heroAll[i].body) {
        heroAll[i].body.SetAngularDamping(0)
        heroAll[i].startPos = new box2d.b2Vec2(heroAll[i].body.GetPosition().x, heroAll[i].body.GetPosition().y)
      }

    // show elements
    show('#btnOptions')
  }

  // showGame
  function showGame() {
    // sky
    const sky = new Actor('sky', SCREEN_WIDTH / 2, 300, 'sky' + Math.random() * 2)
    sky.scale.x = 40
    back.addChild(sky)

    // clouds
    clouds = helper.addLayer('cloud', map, back)
    if (Math.random() > 0.5)
      clouds.reverse()
    for (var i = 0; i < clouds.length; i++) {
      clouds[i].x = SCREEN_WIDTH / 2 * i + Math.random() * SCREEN_WIDTH / 2
      clouds[i].speed = 0.2 + Math.random() * 0.5
      clouds[i].startY = clouds[i].y
    }

    // bg0
    var tex = assets.get('bg0')
    for (var i = 0; i < Math.ceil(SCREEN_WIDTH / tex.width) + 1; i++) {
      const actor = new Actor('', tex.width * i, 500, 'bg0')
      actor.startY = actor.y
      actor.width += 0.5
      back.addChild(actor)
      bg0.push(actor)
    }

    // bg1
    tex = assets.get('bg1')
    for (var i = 0; i < Math.ceil(SCREEN_WIDTH / tex.width) + 1; i++) {
      const actor = new Actor('', tex.width * i, 950, 'bg1')
      actor.startY = actor.y
      actor.width += 0.5
      back.addChild(actor)
      bg1.push(actor)
    }

    // bg2
    tex = assets.get('bg2')
    for (var i = 0; i < Math.ceil(SCREEN_WIDTH / tex.width) + 1; i++) {
      const actor = new Actor('', tex.width * i, 1300, 'bg2')
      actor.startY = actor.y
      actor.width += 0.5
      back.addChild(actor)
      bg2.push(actor)
    }

    // emitter
    emitter = helper.addEmitter(stage, 'emitter.json', ['particle'])
    emitter.emit = false

    // txtScore
    txtScore = new Actor('', 0, 0, 'score')
    txtScore.alpha = 0
    stage.addChild(txtScore)

    // txtJump
    txtJump = new Actor('', 0, 0, 'scoreJump')
    txtJump.alpha = 0
    stage.addChild(txtJump)

    // txtBackFlip
    txtBackFlip = new Actor('', 0, 0, 'scoreBackFlip')
    txtBackFlip.alpha = 0
    stage.addChild(txtBackFlip)

    // txtFlip
    txtFlip = new Actor('', 0, 0, 'scoreFlip')
    txtFlip.alpha = 0
    stage.addChild(txtFlip)

    startLimit = helper.addLayer('startLimit', map, stage)[0]
    randomPart()
    addHero(stage)

    // controls
    if (PIXI.isMobile.any) {
      // controlLeft
      controlLeft = new Actor('', 0, 0, 'controlLeft')
      controlLeft.alpha = showControls ? 0.5 : 0
      controlLeft.eventMode = 'static'
      front.addChild(controlLeft)
      controlLeft.on('pointerdown', function (e) {
        controlLeft.scale.set(0.95)
        if (hero.enabled) {
          if (e.globalX > controlLeft.x) {
            keyRight = true
            keyLeft = false
          }
          else {
            keyLeft = true
            keyRight = false
          }

          // move
          controlLeft.on('pointermove', function (e) {
            if (hero.enabled) {
              if (e.globalX > controlLeft.x) {
                keyRight = true
                keyLeft = false
              }
              else {
                keyLeft = true
                keyRight = false
              }
            }
          })
        }
      })
      controlLeft.on('pointerup', function (e) {
        controlLeft.scale.set(1)
        keyLeft = false
        keyRight = false
        controlLeft.off('pointermove')
      })
      controlLeft.on('pointerupoutside', function (e) {
        controlLeft.scale.set(1)
        keyLeft = false
        keyRight = false
        controlLeft.off('pointermove')
      })

      // controlRight
      controlRight = new Actor('', 0, 0, 'controlRight')
      controlRight.alpha = showControls ? 0.5 : 0
      controlRight.eventMode = 'static'
      front.addChild(controlRight)
      controlRight.on('pointerdown', function (e) {
        controlRight.scale.set(0.95)
        if (hero.enabled)
          keyUp = true
      })
      controlRight.on('pointerup', function (e) {
        controlRight.scale.set(1)
        keyUp = false
      })
      controlRight.on('pointerupoutside', function (e) {
        controlRight.scale.set(1)
        keyUp = false
      })

      // hide
      controlLeft.delay(3).to({ alpha: 0 }, 1)
      controlRight.delay(3).to({ alpha: 0 }, 1)
    }
    else if (showControls) // show message
      helper.message('Controls: <b>LEFT</b>, <b>RIGHT</b>, <b>UP</b> or <b>A</b>, <b>D</b>, <b>W</b>')
    showControls = false

    // show elements
    show('#btnBack, #btnPause')
  }

  // render
  function render(delta) {
    switch (screen) {
      case 'main':
        renderMain(delta)
        break
      case 'game':
        renderGame(delta)
        break
    }
  }

  // renderMain
  function renderMain(delta) {
    // clouds
    for (var i = 0; i < clouds.length; i++) {
      clouds[i].x -= clouds[i].speed * delta
      if (clouds[i].x < - clouds[i].width / 2) {
        clouds[i].x = SCREEN_WIDTH + clouds[i].width / 2
        clouds[i].speed = 0.2 + Math.random() * 0.5
      }
    }

    // bg
    moveBg(bg0, 3, 9)
    moveBg(bg1, 2, 6)
    moveBg(bg2, 1, 3)

    // head elements
    ears.position.set(head.x, head.y)
    eyes.position.set(head.x, head.y)
    stage.toLocal(new PIXI.Point(0, 35), head, mouth.position)
    ears.rotation = head.rotation
    eyes.rotation = head.rotation
    mouth.rotation = head.rotation

    // hero
    if (hero.enabled) {
      if (hero.x > 2200) // reset
        resetHero()
      else { // move
        if (hero.body.GetLinearVelocity().x < 15) {
          tireRight.body.ApplyTorque(150, true)
          tireLeft.body.ApplyTorque(150, true)
        } else
          hero.body.SetLinearVelocity(new box2d.b2Vec2(15, hero.body.GetLinearVelocity().y))
      }
    }
    else if (!hero.die) // die
      dieHero()
  }

  // renderGame
  function renderGame(delta) {
    // head elements
    ears.position.set(head.x, head.y)
    eyes.position.set(head.x, head.y)
    stage.toLocal(new PIXI.Point(0, 35), head, mouth.position)
    ears.rotation = head.rotation
    eyes.rotation = head.rotation
    mouth.rotation = head.rotation

    if (hero.enabled) {
      // hero fall down
      if (hero.y > SCREEN_HEIGHT) {
        playSound('sndDie')
        gameOver()
      }

      // move
      if (!hero.flipNow)
        if (keyLeft) { // back
          if (hero.body.GetLinearVelocity().x > -MAX_SPEED && onGround > 0) {
            tireRight.body.ApplyTorque(-ACCELERATION, true)
            tireLeft.body.ApplyTorque(-ACCELERATION, true)
          }
          board.body.SetAngularVelocity(onGround > 0 ? 0 : HERO_TURN) // turn
          hero.lastKey = 'left'
        } else if (keyRight) { // forward
          if (hero.body.GetLinearVelocity().x < MAX_SPEED && onGround > 0) {
            tireRight.body.ApplyTorque(ACCELERATION, true)
            tireLeft.body.ApplyTorque(ACCELERATION, true)
          }
          board.body.SetAngularVelocity(onGround > 0 ? 0 : -HERO_TURN) // turn
          hero.lastKey = 'right'
        }

      if (keyUp) {
        keyUp = false
        if (onGround > 0) { // jump
          delete hero.lastAngle
          delete hero.flipNow
          tireLeft.body.SetLinearVelocity(new box2d.b2Vec2(tireLeft.body.GetLinearVelocity().x, 0))
          tireRight.body.SetLinearVelocity(new box2d.b2Vec2(tireRight.body.GetLinearVelocity().x, 0))
          board.body.SetLinearVelocity(new box2d.b2Vec2(board.body.GetLinearVelocity().x, 0))
          board.body.ApplyLinearImpulse(new box2d.b2Vec2(0, -HERO_JUMP), board.body.GetPosition(), true)
          playSound('sndJump')
          headAnimation()

          // long jump
          hero.clearAnimations().delay(1.5, function () {
            score += 100
            txtJump.clearAnimations()
            txtJump.position.set(hero.x + 500, 700)
            txtJump.scale.set(1)
            txtJump.alpha = 1
            txtJump.to({ alpha: 0, scale: 2, y: txtJump.y - 100 }, 1)

            if (!sounds['sndUh'].playing())
              playSound('sndUh')
          })
        } else if (!hero.flipNow && hero.body.GetLinearVelocity().y < 0) { // flip
          board.body.ApplyAngularImpulse(hero.lastKey == 'left' ? HERO_FLIP : -HERO_BACKFLIP)
          hero.lastAngle = hero.angle
          hero.flipNow = hero.lastKey == 'left' ? 'flip' : 'backflip'
        }
      }
    }
    else if (!hero.die) // die
      dieHero()

    // camera position
    helper.cameraPosition(hero.x + 400, hero.y, mapWidth, map.map_height, startLimit.x)

    // next random part
    if (mapWidth - stage.x - stage.pivot.x < SCREEN_WIDTH / 2)
      randomPart()

    // bg
    moveBg(bg0, 3, 3)
    moveBg(bg1, 2, 2)
    moveBg(bg2, 1, 1)

    // clouds
    for (var i = 0; i < clouds.length; i++) {
      clouds[i].x -= clouds[i].speed * delta
      clouds[i].y = clouds[i].startY + (PARALAX.ground - Math.min(hero.y, SCREEN_HEIGHT)) / PARALAX.y / 4
      if (clouds[i].x < - clouds[i].width / 2) {
        clouds[i].x = SCREEN_WIDTH + clouds[i].width / 2
        clouds[i].speed = 0.2 + Math.random() * 0.5
      }
    }
  }

  // resize
  function resize() {
    // controlLeft
    if (controlLeft) {
      controlLeft.position.set(helper.pointLeftBottom.x + controlLeft.width / 2 + 50, helper.pointLeftBottom.y - controlLeft.height / 2 - 50)
      controlLeft.hitArea = new PIXI.Rectangle((controlLeft.x - SCREEN_WIDTH / 2), -SCREEN_HEIGHT, (SCREEN_WIDTH / 2 - controlLeft.x) * 2, SCREEN_HEIGHT * 2)
    }

    // controlRight
    if (controlRight) {
      controlRight.position.set(helper.pointRightBottom.x - controlRight.width / 2 - 50, helper.pointRightBottom.y - controlRight.height / 2 - 50)
      controlRight.hitArea = new PIXI.Rectangle((SCREEN_WIDTH / 2 - controlRight.x), -SCREEN_HEIGHT, (controlRight.x - SCREEN_WIDTH / 2) * 2, SCREEN_HEIGHT * 2)
    }
    
    // Position wallet buttons if they exist
    if (window.btnWallet) {
      // Calculate position based on screen dimensions
      // Use a percentage of screen width for more responsive positioning
      const screenWidthPercentage = 0.90; // Position at 85% of screen width
      const rightPosition = helper.pointLeftTop.x + (helper.pointRightTop.x - helper.pointLeftTop.x) * screenWidthPercentage;
      const topPosition = helper.pointRightTop.y + 140; // 140px from top
      
      // Ensure buttons are within visible screen area
      const maxRightPosition = helper.pointRightTop.x - btnWallet.width/2 - 20; // 20px margin
      const actualRightPosition = Math.min(rightPosition, maxRightPosition);
      
      btnWallet.position.set(actualRightPosition, topPosition);
      
      // Position fund button below wallet button with proper spacing
      if (window.btnFund) {
        btnFund.position.set(actualRightPosition, topPosition + 80);
      }
      
      // Make sure text is readable by adjusting scale if needed
      const minScale = 0.7;
      const maxScale = 1.0;
      const screenWidthRatio = Math.min(Math.max(document.body.offsetWidth / SCREEN_WIDTH, minScale), maxScale);
      
      btnWallet.scale.set(screenWidthRatio);
      if (window.btnFund) {
        btnFund.scale.set(screenWidthRatio);
      }
    }

    // reset hero
    if (screen == 'main' && hero && PIXI.isMobile.any)
      resetHero()
  }

  // click
  /** @param {Actor|AnimatedActor} actor */
  function click(actor) {
    // btnBack
    if (actor.name == 'btnBack') {
      loadScreen('main')
      return
    }
  }

  // key
  function key() {
    window.addEventListener('keydown', function (e) {
      if (e.repeat) return
      switch (e.code) {
        case 'Escape': // back
          // hide modals or back from game to main
          if (!hide(".modal[style*='opacity: 1']", 0.2) && screen == 'game')
            loadScreen('main')
          break
        case 'KeyR': // reload
          if (screen != '')
            loadScreen(screen)
          break
        case 'KeyM': // mute
          if (element('#btnSound'))
            element('#btnSound').click()
          break
        case 'KeyP': // pause
          if (element('#btnPause'))
            element('#btnPause').click()
          break
        case 'KeyO': // options
          if (element('#btnOptions'))
            element('#btnOptions').click()
          break
        case 'Enter': // screen
        case 'NumpadEnter':
          if (element('#btnScreen'))
            element('#btnScreen').click()
          break
        case 'ArrowLeft':
        case 'KeyA':
          if (hero && hero.enabled)
            keyLeft = true
          break
        case 'ArrowRight':
        case 'KeyD':
          if (hero && hero.enabled)
            keyRight = true
          break
        case 'ArrowUp':
        case 'KeyW':
          if (hero && hero.enabled)
            keyUp = true
          break
      }
    })

    window.addEventListener('keyup', function (e) {
      switch (e.code) {
        case 'ArrowLeft':
        case 'KeyA':
          keyLeft = false
          break
        case 'ArrowRight':
        case 'KeyD':
          keyRight = false
          break
        case 'ArrowUp':
        case 'KeyW':
          keyUp = false
          break
      }
    })
  }

  // beginContact
  /** @param {Actor|AnimatedActor} actor1, @param {Actor|AnimatedActor} actor2, @param {Box2D.b2Contact} contact */
  function beginContact(actor1, actor2, contact) {
    if (!hero.enabled)
      return

    // hero & jump
    if (hit('hero', 'jump', actor1, actor2)) {
      board.body.ApplyLinearImpulse(new box2d.b2Vec2(0, -250), board.body.GetPosition(), true)
      board.body.ApplyAngularImpulse(-240, true)
      headAnimation()
      return
    }

    // cake
    if (actor1.name == 'cake' || actor2.name == 'cake') {
      const actor = actor1.name == 'cake' ? actor1 : actor2
      if (actor.enabled) {
        actor.enabled = false

        // score
        score += 10
        txtScore.clearAnimations()
        txtScore.position.set(actor.x, actor.y)
        txtScore.scale.set(1)
        txtScore.alpha = 1
        txtScore.to({ alpha: 0, scale: 2, y: txtScore.y - 200 }, 0.5)

        actor.destroy()
        playSound('sndCake')
      }
      return
    }

    // tire
    if (actor1.name == 'tire' || actor2.name == 'tire') {
      var tire, otherActor

      if (actor1.name == 'tire') {
        tire = actor1
        otherActor = actor2
      }
      else {
        tire = actor2
        otherActor = actor1
      }

      hero.clearAnimations()
      onGround++

      // check flip
      if (hero.lastAngle && Math.abs(Math.abs(hero.lastAngle) - Math.abs(hero.angle)) > 180) {
        if (hero.flipNow == 'backflip') {
          score += 50
          txtBackFlip.clearAnimations()
          txtBackFlip.position.set(hero.x + (txtJump.alpha == 0 ? 500 : 700), 700)
          txtBackFlip.scale.set(1)
          txtBackFlip.alpha = 1
          txtBackFlip.to({ alpha: 0, scale: 2, y: txtBackFlip.y - 100 }, 1)
        }
        else {
          score += 100
          txtFlip.clearAnimations()
          txtFlip.position.set(hero.x + (txtJump.alpha == 0 ? 500 : 600), 700)
          txtFlip.scale.set(1)
          txtFlip.alpha = 1
          txtFlip.to({ alpha: 0, scale: 2, y: txtFlip.y - 100 }, 1)
        }

        if (!sounds['sndUh'].playing())
          playSound('sndUh')
      }

      // ground
      if (otherActor.name.startsWith('p') && otherActor.name != 'pipe') {
        emitter.updateOwnerPos(tire.x, tire.y + tire.height / 2 + 5)
        emitter.emitNow()
        emitter.emitNow()
        emitter.emitNow()
        playSound('sndGround')
      }

      // spring
      if (hero.body.GetLinearVelocity().y > 7 && !sounds['sndSpring'].playing())
        playSound('sndSpring')

      delete hero.lastAngle
      delete hero.flipNow
    }

    // head & platform
    if ((actor1.name == 'head' || actor2.name == 'head') && actor1.name != 'startLimit' && actor2.name != 'startLimit') {
      playSound('sndFall' + Math.round(Math.random() * 1))
      if (screen == 'game')
        gameOver(false)
      else if (screen == 'main')
        hero.enabled = false
      return
    }

    // tire & bulk
    if (hit('tire', 'bulk', actor1, actor2)) {
      const actor = actor1.name == 'tire' ? actor2 : actor1
      if (actor.enabled) {
        actor.enabled = false
        actor.delay(0.5, function (target) {
          target.enabled = true
        })
        playSound('sndBulk' + Math.round(Math.random() * 2))
      }
      return
    }

    // tire & pipe
    if (hit('tire', 'pipe', actor1, actor2)) {
      const actor = actor1.name == 'tire' ? actor2 : actor1
      if (actor.enabled) {
        actor.enabled = false
        actor.delay(0.5, function (target) {
          target.enabled = true
        })
        playSound('sndPipe' + Math.round(Math.random()))
      }
      return
    }

    // tire & container
    if (hit('tire', 'container', actor1, actor2)) {
      const actor = actor1.name == 'tire' ? actor2 : actor1
      if (actor.enabled) {
        actor.enabled = false
        actor.delay(0.5, function (target) {
          target.enabled = true
        })
        playSound('sndMetal' + Math.round(Math.random()))
      }
      return
    }

    // tire & stone
    if (hit('tire', 'stone', actor1, actor2)) {
      const actor = actor1.name == 'tire' ? actor2 : actor1
      if (actor.enabled) {
        actor.enabled = false
        actor.delay(0.5, function (target) {
          target.enabled = true
        })
        playSound('sndStone' + Math.round(Math.random()))
      }
      return
    }

    // tire & box, board & box
    if (hit('tire', 'box', actor1, actor2) || hit('board', 'box', actor1, actor2)) {
      const actor = actor1.name == 'box' ? actor1 : actor2
      if (actor.enabled) {
        actor.enabled = false
        actor.delay(0.5, function (target) {
          target.enabled = true
        })
        playSound('sndBox')
      }
      return
    }

    // tire & house
    if (hit('tire', 'house', actor1, actor2)) {
      const actor = actor1.name == 'tire' ? actor2 : actor1
      if (actor.enabled) {
        actor.enabled = false
        actor.delay(0.5, function (target) {
          target.enabled = true
        })
        playSound('sndHouse')
      }
      return
    }
  }

  // endContact
  /** @param {Actor|AnimatedActor} actor1, @param {Actor|AnimatedActor} actor2, @param {Box2D.b2Contact} contact */
  function endContact(actor1, actor2, contact) {
    // tire
    if ((actor1 && actor1.name == 'tire') || (actor2 && actor2.name == 'tire'))
      onGround = Math.max(onGround - 1, 0)
  }

  // beforeContact
  /** @param {Actor|AnimatedActor} actor1, @param {Actor|AnimatedActor} actor2, @param {Box2D.b2Contact} contact, @param {Box2D.b2Manifold} oldManifold */
  function beforeContact(actor1, actor2, contact, oldManifold) { }

  // afterContact
  /** @param {Actor|AnimatedActor} actor1, @param {Actor|AnimatedActor} actor2, @param {Box2D.b2Contact} contact, @param {Box2D.b2ContactImpulse} impulse */
  function afterContact(actor1, actor2, contact, impulse) { }

  // gameOver
  function gameOver() {
    hero.enabled = false
    keyLeft = keyRight = keyUp = false
    playSound('sndGameOver')
    hero.body.SetLinearDamping(5)

    // hide controls
    if (controlLeft && controlRight) {
      controlLeft.to({ autoAlpha: 0 }, 0.2)
      controlRight.to({ autoAlpha: 0 }, 0.2)
    }

    // hide elements
    hide('#btnBack, #btnPause, #info', 0.2)

    // bg
    const bg = new PIXI.Graphics()
    bg.beginFill(0x000000)
    bg.drawRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT)
    bg.endFill()
    bg.alpha = 0
    front.addChild(bg)
    gsap.to(bg, 2, { pixi: { alpha: 0.5 } })

    // group
    const actors = helper.addLayer('gameOver', map, front)

    // add score
    var scoreValue = score + ''
    const numbers = []
    var w = 0
    for (var i = 0; i < scoreValue.length; i++) {
      const actor = new Actor('', 0, 780, scoreValue.substring(i, i + 1))
      front.addChild(actor)
      numbers.push(actor)
      actors.push(actor)
      w += actor.width
    }

    // set score position
    var x = (SCREEN_WIDTH - w) / 2
    for (var i = 0; i < numbers.length; i++) {
      numbers[i].x = x + numbers[i].width / 2
      x += numbers[i].width
    }

    // show elements
    for (var i = 0; i < actors.length; i++)
      switch (actors[i].name) {
        case 'btnBack':
          actors[i].delay(2).from({ x: actors[i].x - 100, alpha: 0 }, 0.5, 'back.out')
          break
        case 'btnStart':
          actors[i].delay(2).from({ x: actors[i].x + 100, alpha: 0 }, 0.5, 'back.out', function (target) {
            gsap.to(target.scale, 0.5, { x: 1.05, y: 1.05, yoyo: true, repeat: -1, ease: 'none' })
            console.log('btnStart clicked');
            
            // Add event handler for btnStart
            target.on('pointertap', async () => {
              console.log('Play button clicked in game over screen');
              if (target.enabled) {
                // Check if we're on Core DAO network
                if (window.ethereum) {
                  const onCoreNetwork = await ensureCoreNetwork();
                  if (!onCoreNetwork) {
                    return;
                  }
                }
                
                // Call the unlock function
                const success = await callUnlockFunction();
                if (success) {
                  // If transaction was successful, restart the game
                  loadScreen('game');
                }
              }
            });
          })
          break
        case 'score':
          if (score > storage.get('score', 0) && storage.get('score', 0) > 0) { // new record
            actors[i].destroy()
            const recordActors = helper.addLayer('record', map, front)
            for (var j = 0; j < recordActors.length; j++)
              recordActors[j].delay(2 + j * 0.1).from({ angle: Math.random() * 360, x: SCREEN_WIDTH / 2, y: 780, scale: 2, alpha: 0 }, 0.1, 'back.out')
            gsap.delayedCall(3, function () {
              for (var j = 0; j < recordActors.length; j++)
                recordActors[j].to({ alpha: 0 }, 0.2).to({ alpha: 1 }, 0.2)
              playSound('sndRecord')
            })
          }
          else
            actors[i].delay(1.5 + i * 0.15).from({ scale: 0 }, 1, 'elastic.out')
          break
        default:
          actors[i].delay(1.5 + i * 0.15).from({ scale: 0 }, 1, 'elastic.out')
          break
      }

    // save score
    storage.set('score', Math.max(score, storage.get('score', 0)))
    
  }

  // addHero
  function addHero(container) {
    heroAll = helper.addLayer('hero', map, container, true)
    board = heroAll[0]
    legLeft = heroAll[1]
    legRight = heroAll[2]
    const handLeft = heroAll[3]
    const handRight = heroAll[4]
    hero = heroAll[5]
    ears = heroAll[6]
    head = heroAll[7]
    eyes = heroAll[8]
    mouth = heroAll[9]
    tireLeft = heroAll[10]
    tireRight = heroAll[11]

    // mouth
    mouth.scale.set(0.8, 0.45)

    tireLeft.body.SetAngularDamping(2)
    tireRight.body.SetAngularDamping(2)
    head.body.SetAngularDamping(50)
    hero.body.SetAngularDamping(50)

    board.body.SetBullet(true)
    tireLeft.body.SetBullet(true)
    tireRight.body.SetBullet(true)

    // hero & head
    var joint = new box2d.b2WheelJointDef()
    joint.bodyA = head.body
    joint.bodyB = hero.body
    joint.localAnchorA.Set(-20 / PPM, 30 / PPM)
    joint.localAnchorB.Set(-20 / PPM, -21 / PPM)
    joint.localAxisA.Set(0, -1)
    joint.upperTranslation = 10 / PPM
    joint.enableLimit = true
    joint.stiffness = 500
    joint.damping = 50
    helper.addJoint(joint, box2d.b2WheelJoint)
    box2d.destroy(joint)

    // hero & head
    joint = new box2d.b2WheelJointDef()
    joint.bodyA = head.body
    joint.bodyB = hero.body
    joint.localAnchorA.Set(20 / PPM, 30 / PPM)
    joint.localAnchorB.Set(20 / PPM, -21 / PPM)
    joint.localAxisA.Set(0, -1)
    joint.upperTranslation = 10 / PPM
    joint.enableLimit = true
    joint.stiffness = 500
    joint.damping = 50
    helper.addJoint(joint, box2d.b2WheelJoint)
    box2d.destroy(joint)

    // hero & handLeft
    joint = new box2d.b2RevoluteJointDef()
    joint.bodyA = handLeft.body
    joint.bodyB = hero.body
    joint.localAnchorA.Set(10 / PPM, 0 / PPM)
    joint.localAnchorB.Set(-22 / PPM, -2 / PPM)
    joint.lowerAngle = helper.toRadians(0)
    joint.upperAngle = helper.toRadians(40)
    joint.maxMotorTorque = 2
    joint.motorSpeed = -1
    joint.enableMotor = true
    joint.enableLimit = true
    handLeftJoint = helper.addJoint(joint, box2d.b2RevoluteJoint)
    box2d.destroy(joint)

    // hero & handRight
    joint = new box2d.b2RevoluteJointDef()
    joint.bodyA = handRight.body
    joint.bodyB = hero.body
    joint.localAnchorA.Set(-10 / PPM, 0 / PPM)
    joint.localAnchorB.Set(22 / PPM, -2 / PPM)
    joint.lowerAngle = helper.toRadians(-40)
    joint.upperAngle = helper.toRadians(0)
    joint.maxMotorTorque = 2
    joint.motorSpeed = 1
    joint.enableMotor = true
    joint.enableLimit = true
    handRightJoint = helper.addJoint(joint, box2d.b2RevoluteJoint)
    box2d.destroy(joint)

    // hero & legLeft
    joint = new box2d.b2WheelJointDef()
    joint.bodyA = legLeft.body
    joint.bodyB = hero.body
    joint.localAnchorA.Set(-10 / PPM, 0)
    joint.localAnchorB.Set(-26 / PPM, 28 / PPM)
    joint.localAxisA.Set(0, -1)
    joint.lowerTranslation = -20 / PPM
    joint.enableLimit = true
    joint.stiffness = 500
    joint.damping = 50
    heroJoints.push(helper.addJoint(joint, box2d.b2WheelJoint))
    box2d.destroy(joint)

    // hero & legRight
    joint = new box2d.b2WheelJointDef()
    joint.bodyA = legRight.body
    joint.bodyB = hero.body
    joint.localAnchorA.Set(10 / PPM, 0)
    joint.localAnchorB.Set(26 / PPM, 28 / PPM)
    joint.localAxisA.Set(0, -1)
    joint.lowerTranslation = -20 / PPM
    joint.enableLimit = true
    joint.stiffness = 500
    joint.damping = 50
    heroJoints.push(helper.addJoint(joint, box2d.b2WheelJoint))
    box2d.destroy(joint)

    // legLeft & board
    joint = new box2d.b2WeldJointDef()
    joint.bodyA = board.body
    joint.bodyB = legLeft.body
    joint.localAnchorA.Set(-24 / PPM, 0 / PPM)
    joint.localAnchorB.Set(-8 / PPM, 16 / PPM)
    heroJoints.push(helper.addJoint(joint, box2d.b2WeldJoint))
    box2d.destroy(joint)

    // legRight & board
    joint = new box2d.b2WeldJointDef()
    joint.bodyA = board.body
    joint.bodyB = legRight.body
    joint.localAnchorA.Set(24 / PPM, 0 / PPM)
    joint.localAnchorB.Set(8 / PPM, 16 / PPM)
    heroJoints.push(helper.addJoint(joint, box2d.b2WeldJoint))
    box2d.destroy(joint)

    // tireLeft & board
    joint = new box2d.b2WheelJointDef()
    joint.bodyA = board.body
    joint.bodyB = tireLeft.body
    joint.localAnchorA.Set(-45 / PPM, 13 / PPM)
    joint.localAnchorB.Set(0, 0)
    joint.localAxisA.Set(0.3, -1)
    joint.upperTranslation = 10 / PPM
    joint.enableLimit = true
    joint.stiffness = 1000
    joint.damping = 50
    helper.addJoint(joint, box2d.b2WheelJoint)
    box2d.destroy(joint)

    // tireRight & board
    joint = new box2d.b2WheelJointDef()
    joint.bodyA = board.body
    joint.bodyB = tireRight.body
    joint.localAnchorA.Set(45 / PPM, 13 / PPM)
    joint.localAnchorB.Set(0, 0)
    joint.localAxisA.Set(-0.3, -1)
    joint.upperTranslation = 10 / PPM
    joint.enableLimit = true
    joint.stiffness = 1000
    joint.damping = 50
    helper.addJoint(joint, box2d.b2WheelJoint)
    box2d.destroy(joint)
  }

  // dieHero
  function dieHero() {
    hero.die = true
    hero.clearAnimations()
    hero.body.SetAngularDamping(1)
    head.body.SetAngularDamping(1)

    // remove joints
    for (var i = 0; i < heroJoints.length; i++) {
      world.DestroyJoint(heroJoints[i])
      heroJoints[i] = null
    }
    heroJoints = null

    // board can be hit with hero
    var filter = new box2d.b2Filter()
    filter.categoryBits = helper.CATEGORY_BITS[0]
    board.body.GetFixtureList().SetFilterData(filter)

    // update joints
    handLeftJoint.EnableMotor(false)
    handRightJoint.EnableMotor(false)
    handLeftJoint.SetLimits(helper.toRadians(-60), helper.toRadians(90))
    handRightJoint.SetLimits(helper.toRadians(-90), helper.toRadians(60))

    // hero & legLeft
    var joint = new box2d.b2RevoluteJointDef()
    joint.bodyA = hero.body
    joint.bodyB = legLeft.body
    joint.localAnchorA.Set(-8 / PPM, 20 / PPM)
    joint.localAnchorB.Set(8 / PPM, -8 / PPM)
    joint.lowerAngle = helper.toRadians(-50)
    joint.upperAngle = helper.toRadians(70)
    joint.enableLimit = true
    helper.addJoint(joint, box2d.b2RevoluteJoint)
    box2d.destroy(joint)

    // hero & legRight
    joint = new box2d.b2RevoluteJointDef()
    joint.bodyA = hero.body
    joint.bodyB = legRight.body
    joint.localAnchorA.Set(8 / PPM, 20 / PPM)
    joint.localAnchorB.Set(-8 / PPM, -8 / PPM)
    joint.lowerAngle = helper.toRadians(-70)
    joint.upperAngle = helper.toRadians(50)
    joint.enableLimit = true
    helper.addJoint(joint, box2d.b2RevoluteJoint)
    box2d.destroy(joint)
  }

  // moveBg
  /** @param {Array<Actor|AnimatedActor>} bg */
  function moveBg(bg, coefX, coefY) {
    if (screen == 'game' && stage.pivot.x > startLimit.x + SCREEN_WIDTH / 2 && stage.pivot.x < mapWidth - SCREEN_WIDTH / 2) { // x & y
      for (var i = 0; i < bg.length; i++)
        bg[i].position.set(bg[i].x - hero.body.GetLinearVelocity().x / PARALAX.x / coefX, bg[i].startY + (PARALAX.ground - Math.min(hero.y, SCREEN_HEIGHT)) / PARALAX.y / coefY)

      if (bg[0].x < -bg[0].texture.width / 2) {
        bg[0].x = bg[bg.length - 1].x + bg[0].texture.width
        bg.push(bg.shift())
      }
      if (bg[0].x > bg[0].texture.width / 2) {
        bg[bg.length - 1].x = bg[0].x - bg[0].texture.width
        bg.unshift(bg.pop())
      }
    }
    else // only y
      for (var i = 0; i < bg.length; i++)
        bg[i].y = bg[i].startY + (PARALAX.ground - Math.min(hero.y, SCREEN_HEIGHT)) / PARALAX.y / coefY
  }

  // randomPart
  function randomPart() {
    if (currentPart >= 2) {
      // remove prev part
      for (var i = 0; i < leftActors[currentPart - 1].length; i++)
        leftActors[currentPart - 1][i].destroy()
      delete leftActors[currentPart - 1]

      // move forward start limit
      startLimit.body.SetTransform(new box2d.b2Vec2(startLimit.body.GetPosition().x + PART_WIDTH / PPM, startLimit.body.GetPosition().y), startLimit.body.GetAngle())
    }

    // next part
    currentPart++
    leftActors[currentPart] = helper.addLayer('p' + Math.round(Math.random() * (currentPart == 1 ? 7 : 43)), map, stage, false, mapWidth)
    updateActors()
    mapWidth += PART_WIDTH
  }

  // updateActors
  function updateActors() {
    // part actors
    for (var i = leftActors[currentPart].length - 1; i >= 0; i--) {
      const actor = leftActors[currentPart][i]

      switch (actor.name) {
        case 'ground':
          actor.width += 0.5
          actor.height += 0.5
          break
        case 'box':
        case 'pipe':
        case 'bulk':
          actor.width += 0.5
          actor.height += 0.5
          break
        case 'cake':
          actor.texture = assets.get('cake' + Math.round(Math.random() * 14))
          gsap.to(actor.scale, 0.3, { x: 0.8, y: 0.8, yoyo: true, repeat: -1, ease: 'none', delay: Math.random() * 0.3 })
          break
      }

      actor.toBack()
    }
  }

  // resetHero
  function resetHero() {
    for (var i = 0; i < heroAll.length; i++)
      if (heroAll[i].body) {
        heroAll[i].body.SetLinearVelocity(new box2d.b2Vec2(0, 0))
        heroAll[i].body.SetAngularVelocity(0)
        heroAll[i].body.SetTransform(heroAll[i].startPos, 0)
      }
  }

  // headAnimation
  function headAnimation() {
    ears.clearAnimations()
    eyes.clearAnimations()
    mouth.clearAnimations()

    ears.scale.set(1)
    eyes.anchor.set(0.5)
    mouth.scale.set(0.8, 0.45)

    gsap.to(ears.scale, 0.4, { x: 0.98, y: 0.9, yoyo: true, repeat: 1 })
    gsap.to(eyes.anchor, 0.4, { y: 0.53, yoyo: true, repeat: 1 })
    gsap.to(mouth.scale, 0.4, { x: 1, y: 1, yoyo: true, repeat: 1 })
  }

  // Add this function to initialize the contract
  async function initializeContract() {
    if (window.ethereum && userAddress) {
      try {
        // Ensure we're on Core DAO network
        const onCoreNetwork = await ensureCoreNetwork();
        if (!onCoreNetwork) {
          return false;
        }
        
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const signer = provider.getSigner();
        gameContract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
        console.log('Contract initialized on Core DAO network');
        return true;
      } catch (error) {
        console.error('Error initializing contract:', error);
        return false;
      }
    } else {
      console.error('Ethereum provider or user address not available');
      return false;
    }
  }

  // Add this function to call the unlock function
  async function callUnlockFunction() {
    // Check if user is connected to wallet
    if (!userAddress) {
      helper.message('Please connect your wallet first');
      const address = await connectWallet();
      if (!address) {
        return false;
      }
      userAddress = address;
    }
    
    // Initialize contract if needed
    if (!gameContract) {
      const initialized = await initializeContract();
      if (!initialized) {
        helper.message('Unable to initialize contract. Please check your wallet connection and make sure you are on the Core DAO network.');
        return false;
      }
    }
    
    try {
      helper.message('Unlocking rewards on Core DAO network...');
      const tx = await gameContract.unlock();
      console.log('Unlock transaction sent:', tx.hash);
      
      // Wait for transaction to be mined
      const receipt = await tx.wait();
      console.log('Unlock transaction confirmed:', receipt);
      
      helper.message('Rewards unlocked successfully!');
      return true;
    } catch (error) {
      console.error('Error calling unlock function:', error);
      helper.message('Failed to unlock rewards. Please try again.');
      return false;
    }
  }
})()