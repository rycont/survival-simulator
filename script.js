class World {
  creatures = []
  mutation = 1 // 최대 자식 변이 비율
  width = undefined
  height = undefined
  canvas = undefined
  bank = 1000

  constructor({
    canvasElement,
    height,
    width
  }) {
    this.canvas = canvasElement.getContext('2d')
    canvasElement.width = width
    canvasElement.height = height
    this.width = width
    this.height = height
    this.createCreatureFromBankBalance()
    setInterval(() => console.log(this.creatures.reduce((a, b) => a + b.health, 0) + this.bank), 4000)
    requestAnimationFrame(this.loop.bind(this))
  }

  loop() {
    for (const creature of this.creatures) {
      creature.move()
    }
    requestAnimationFrame(this.loop.bind(this))
    this.drawCurrentState()
  }

  createCreatureFromBankBalance() {
    if (this.bank < 100) return
    while (this.bank > 10) {
      console.log('새 부모 등록')
      const givenHealth = Math.random() * this.bank / 5
      this.addCreature(new Creature({
        world: this,
        health: givenHealth
      }))
      this.bank -= givenHealth
    }
  }

  addCreature(newCreature) {
    this.creatures = [...this.creatures, newCreature]
  }

  removeCreature(creature) {
    this.creatures = this.creatures.filter(e => e != creature);
    console.log('removeCreature', creature)
  }

  drawCurrentState() {
    this.canvas.clearRect(0, 0, this.width, this.height);
    this.creatures.forEach(creature => {
      this.canvas.fillStyle = `rgba(${creature.color.join(', ')}, 0.3)`
      const renderable = new Path2D()
      renderable.arc(creature.xPosition, creature.yPosition, creature.health / 2, 0, 2 * Math.PI);

      this.canvas.fill(renderable)
      this.canvas.fillStyle = "black"; //색상지정
      this.canvas.fillText(creature.health, creature.xPosition, creature.yPosition);
    })
  }

  getNearCreature(creature) {
    return this.creatures.filter(e => e !== creature && ((e.xPosition - creature.xPosition) ** 2 + (e.yPosition - creature.yPosition) ** 2) < creature.health ** 2 * 16)
  }

  registerLoss(amount) {
    this.bank += amount
    this.createCreatureFromBankBalance()
  }
}

const getRandomScale = (mutation) => Math.random() * 2 * mutation - mutation + 1

class Creature {
  health = undefined
  childCreationthreshold = undefined
  speed = undefined
  color = undefined
  world = undefined
  direction = undefined

  effect = undefined

  xPosition = undefined
  yPosition = undefined
  path = new Path2D()

  childCreationInterval = undefined

  constructor({
    speed = Math.random() * 5,
    color = Array(3).fill(undefined).map(() => 128 * Math.random() + 64),
    childCreationthreshold = Math.random() * 100,
    health,
    world,
    xPosition = world.width * Math.random(),
    yPosition = world.height * Math.random(),
    direction = Math.random() * Math.PI * 2,
    directionMutation = Math.random(),
    effect = (Math.random() - 0.5) * 3
  } = {}) {
    if (!world) throw "World not inited"
    this.health = health
    this.speed = speed
    this.color = color
    this.world = world
    this.childCreationthreshold = childCreationthreshold
    this.xPosition = xPosition
    this.yPosition = yPosition
    this.direction = direction
    this.directionMutation = directionMutation
    this.effect = effect

    this.childCreationInterval = setInterval(() => {
      const near = this.world.getNearCreature(this)
      if (near.length !== 0)
        near.forEach(other => {
          other.health += this.effect
        })
      this.health -= near.length * this.effect

      if (this.health > this.childCreationthreshold) {
        this.createChild()
      }
    }, 1000)
  }

  destroy() {
    this.world.registerLoss(this.health)
    this.world.removeCreature(this)
    clearInterval(this.childCreationInterval)
  }

  createChild() {
    this.world.addCreature(
      new Creature({
        speed: Math.random() * getRandomScale(this.world.mutation),
        color: this.color.map(unit => unit + (Math.random() - 0.5)),
        world: this.world,
        health: this.health / 2,
        direction: this.direction * getRandomScale(this.world.mutation),
        xPosition: this.xPosition + (Math.random() - 0.5) * 50,
        yPosition: this.yPosition + (Math.random() - 0.5) * 50,
        directionMutation: this.directionMutation * getRandomScale(this.world.mutation),
        effect: this.effect * getRandomScale(this.world.mutation)
      })
    )
    this.health = this.health / 2
  }

  move() {

    this.xPosition += this.speed * Math.cos(this.direction)
    this.yPosition += this.speed * Math.sin(this.direction)

    this.health -= this.speed / 100
    this.world.registerLoss(this.speed / 100)
    if (this.health <= 10) this.destroy()

    this.direction += ((Math.random() - 0.5) * this.directionMutation) / Math.PI

    if (this.xPosition >= this.world.width)
      this.direction = Math.PI - this.direction
    if (this.xPosition <= 0)
      this.direction = Math.PI - this.direction

    if (this.yPosition >= this.world.height)
      this.direction = - this.direction
    if (this.yPosition <= 0)
      this.direction = - this.direction
  }
}

window.world = new World({
  canvasElement: document.getElementById('canvas'),
  height: 800,
  width: 800
})
