// 萌系手绘风渲染器
// @ts-check

(function() {

class CuteRenderer {
  /**
   * @param {HTMLCanvasElement} canvas 
   * @param {number} scale 
   */
  constructor(canvas, scale = 1) {
    this.canvas = canvas
    this.ctx = canvas.getContext('2d')
    this.scale = scale
    this.frame = 0
    this.animationId = 0
    
    // 缓存生成的特征
    this.features = null
    this.lastSeed = null
  }

  /**
   * @param {number} s 
   */
  setScale(s) {
    this.scale = s
  }

  /**
   * @param {() => void} callback 
   */
  startAnimation(callback) {
    const loop = () => {
      this.frame++
      callback()
      this.animationId = requestAnimationFrame(loop)
    }
    loop()
  }

  stopAnimation() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId)
      this.animationId = 0
    }
  }

  /**
   * @typedef {Object} PetFeatures
   * @property {number} bodyType
   * @property {number} earType
   * @property {boolean} hasTail
   * @property {number} tailType
   * @property {number} eyeType
   * @property {number} accessory
   * @property {number} colorVar
   */

  /**
   * 生成基于种子的特征
   * @param {number} seed 
   * @returns {PetFeatures}
   */
  getFeatures(seed) {
    if (this.features && this.lastSeed === seed) {
      return this.features
    }

    // 简单的伪随机数生成器
    const random = () => {
      seed = (seed * 9301 + 49297) % 233280
      return seed / 233280
    }

    this.features = {
      bodyType: Math.floor(random() * 3), // 0: 圆形, 1: 椭圆, 2: 梨形
      earType: Math.floor(random() * 4),  // 0: 猫耳, 1: 兔耳, 2: 熊耳, 3: 下垂耳
      hasTail: random() > 0.3,
      tailType: Math.floor(random() * 2), // 0: 短尾, 1: 长尾
      eyeType: Math.floor(random() * 3),  // 0: 普通, 1: 豆豆眼, 2: 眯眯眼
      accessory: random() > 0.7 ? Math.floor(random() * 3) : -1, // 0: 领结, 1: 发卡, 2: 围巾
      colorVar: random() * 0.2 - 0.1 // 颜色微调
    }
    this.lastSeed = seed
    return this.features
  }

  /**
   * 渲染宠物
   * @param {string} stage 
   * @param {number} mood 
   * @param {boolean} sick 
   * @param {boolean} isMoving 
   * @param {number} direction 
   * @param {any} [colors] 
   * @param {number} [seed] 
   * @param {string} [action]
   */
  renderPet(stage, mood, sick, isMoving, direction, colors, seed = 12345, action = 'idle') {
    const ctx = this.ctx
    if (!ctx) return
    const w = this.canvas.width
    const h = this.canvas.height
    const cx = w / 2
    const cy = h / 2 + 10 //稍微靠下一点

    ctx.clearRect(0, 0, w, h)
    
    // 获取特征
    const f = this.getFeatures(seed)
    
    // 呼吸动画
    const breath = Math.sin(this.frame * 0.05) * 2
    // 如果是睡觉，呼吸慢一点
    const breathSpeed = action === 'sleep' ? 0.02 : 0.05
    const breathAmp = action === 'sleep' ? 3 : 2
    const currentBreath = Math.sin(this.frame * breathSpeed) * breathAmp

    // 动作相关的额外动画
    let bounce = isMoving ? Math.abs(Math.sin(this.frame * 0.2)) * 6 : 0
    if (action === 'playing') bounce += Math.abs(Math.sin(this.frame * 0.3)) * 4
    if (action === 'work') bounce += Math.sin(this.frame * 0.5) * 1 // 工作时微微颤抖
    
    // 颜色处理
    const baseColor = colors?.mid || '#8a8aaa'
    const darkColor = colors?.dark || '#4a4a6a'
    const lightColor = colors?.light || '#b0b0d0'

    ctx.save()
    ctx.translate(cx, cy - bounce)
    ctx.scale(direction, 1) // 左右翻转

    if (stage === 'egg') {
      this.drawEgg(ctx, baseColor, darkColor, lightColor, currentBreath, seed)
      ctx.restore()
      return
    }

    if (stage === 'baby') {
      ctx.scale(0.8, 0.8) // 幼年期比较小
      // 调整：幼年期头身比例，让它看起来更像“幼年”
      // 这里通过调整 offset 来实现
      ctx.translate(0, 5)
    }

    // 绘制身体
    ctx.fillStyle = baseColor
    ctx.strokeStyle = darkColor
    ctx.lineWidth = 3
    ctx.lineJoin = 'round'
    ctx.lineCap = 'round'

    this.drawBody(ctx, f.bodyType, currentBreath)
    
    // 绘制耳朵
    this.drawEars(ctx, f.earType, currentBreath, baseColor, darkColor)

    // 绘制五官
    this.drawFace(ctx, f.eyeType, mood, sick, currentBreath, darkColor, lightColor, action)

    // 绘制配件
    if (f.accessory >= 0) {
      this.drawAccessory(ctx, f.accessory, currentBreath)
    }

    // 绘制动作道具 (在身体上层)
    if (action === 'eating') {
      this.drawFood(ctx, currentBreath)
    } else if (action === 'study') {
      this.drawBook(ctx, currentBreath)
    } else if (action === 'work') {
      this.drawWorkIcon(ctx, currentBreath)
    }

    ctx.restore()

    // 绘制环境/漂浮物 (不需要左右翻转的部分，或者需要独立翻转)
    ctx.save()
    ctx.translate(cx, cy - bounce)
    
    if (action === 'cleaning') {
        this.drawBubbles(ctx, currentBreath)
    } else if (action === 'playing') {
        this.drawBall(ctx, currentBreath, direction)
    } else if (action === 'sleep') {
        this.drawZzz(ctx, currentBreath, direction)
    }

    ctx.restore()
  }

  /**
   * 渲染被提起的状态
   * @param {string} stage
   * @param {number} [seed]
   * @param {any} [colors]
   */
  renderHolding(stage, seed = 12345, colors) {
    const ctx = this.ctx
    if (!ctx) return
    const w = this.canvas.width
    const h = this.canvas.height
    const cx = w / 2
    const cy = h / 2
    
    ctx.clearRect(0, 0, w, h)
    
    const baseColor = colors?.mid || '#8a8aaa'
    const darkColor = colors?.dark || '#4a4a6a'
    const lightColor = colors?.light || '#b0b0d0'

    ctx.save()
    ctx.translate(cx, cy)
    
    if (stage === 'egg') {
      // 蛋被提起时晃动
      ctx.rotate(Math.sin(Date.now() / 100) * 0.2)
      this.drawEgg(ctx, baseColor, darkColor, lightColor, 0)
      ctx.restore()
      return
    }

    if (stage === 'baby') {
      ctx.scale(0.8, 0.8)
    }
    
    const f = this.getFeatures(seed)
    
    // 身体拉长效果
    ctx.scale(0.9, 1.1)
    
    ctx.fillStyle = baseColor
    ctx.strokeStyle = darkColor
    ctx.lineWidth = 3
    
    this.drawBody(ctx, f.bodyType, 0)
    this.drawEars(ctx, f.earType, 0, baseColor, darkColor)
    
    // 惊讶表情
    ctx.fillStyle = '#fff'
    ctx.beginPath()
    ctx.arc(-10, -5, 5, 0, Math.PI * 2)
    ctx.arc(10, -5, 5, 0, Math.PI * 2)
    ctx.fill()
    ctx.stroke()
    
    ctx.fillStyle = darkColor
    ctx.beginPath()
    ctx.arc(-10, -5, 2, 0, Math.PI * 2)
    ctx.arc(10, -5, 2, 0, Math.PI * 2)
    ctx.fill()
    
    // 嘴巴 O型
    ctx.beginPath()
    ctx.arc(0, 5, 3, 0, Math.PI * 2)
    ctx.stroke()
    
    ctx.restore()
  }

  /**
   * @param {CanvasRenderingContext2D} ctx
   * @param {string} baseColor
   * @param {string} darkColor
   * @param {string} lightColor
   * @param {number} breath
   * @param {number} [seed]
   */
  drawEgg(ctx, baseColor, darkColor, lightColor, breath, seed = 12345) {
    ctx.fillStyle = baseColor
    ctx.strokeStyle = darkColor
    ctx.lineWidth = 3
    ctx.beginPath()
    ctx.ellipse(0, 0, 25 + breath, 30 + breath, 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.stroke()
    
    // 使用 seed 来决定蛋的花纹，使其暗示未来的特征
    const f = this.getFeatures(seed)
    
    ctx.fillStyle = darkColor
    ctx.globalAlpha = 0.2
    ctx.beginPath()
    
    if (f.bodyType === 1) { // 椭圆身 - 横条纹
        ctx.rect(-20, -10, 40, 5)
        ctx.rect(-22, 5, 44, 5)
    } else if (f.bodyType === 2) { // 梨形身 - 波浪纹
        // 简化为圆点
        ctx.arc(0, 0, 8, 0, Math.PI * 2)
        ctx.arc(0, 15, 5, 0, Math.PI * 2)
        ctx.arc(0, -15, 5, 0, Math.PI * 2)
    } else { // 圆形身 - 斑点
        ctx.arc(-10, -10, 5, 0, Math.PI * 2)
        ctx.arc(15, 5, 8, 0, Math.PI * 2)
        ctx.arc(-5, 15, 4, 0, Math.PI * 2)
    }
    
    ctx.fill()
    ctx.globalAlpha = 1.0
    
    // 高光
    ctx.fillStyle = lightColor
    ctx.beginPath()
    ctx.ellipse(-8, -12, 6, 8, 0.5, 0, Math.PI * 2)
    ctx.fill()
  }

  /**
   * @param {CanvasRenderingContext2D} ctx
   * @param {number} type
   * @param {number} breath
   */
  drawBody(ctx, type, breath) {
    ctx.beginPath()
    if (type === 0) { // 圆形
      ctx.arc(0, 0, 30 + breath, 0, Math.PI * 2)
    } else if (type === 1) { // 椭圆
      ctx.ellipse(0, 5, 35 + breath, 25 + breath, 0, 0, Math.PI * 2)
    } else { // 梨形/不倒翁
      ctx.moveTo(0, -25 - breath)
      ctx.bezierCurveTo(-20, -25, -35, 0, -35, 15)
      ctx.bezierCurveTo(-35, 35, -15, 35, 0, 35 + breath)
      ctx.bezierCurveTo(15, 35, 35, 35, 35, 15)
      ctx.bezierCurveTo(35, 0, 20, -25, 0, -25 - breath)
    }
    ctx.fill()
    ctx.stroke()
  }

  /**
   * @param {CanvasRenderingContext2D} ctx
   * @param {number} type
   * @param {number} breath
   * @param {string} color
   * @param {string} stroke
   */
  drawEars(ctx, type, breath, color, stroke) {
    ctx.fillStyle = color
    ctx.strokeStyle = stroke
    
    // 耳朵绘制在身体图层之后，需要调整 globalCompositeOperation 或者在 drawBody 之前调用
    // 这里为了简单，我们假设耳朵在头上，直接画
    // 为了不遮挡身体轮廓，可以画在 save/restore 的底层，或者...
    // 简单的做法：先画身体，耳朵画在头上
    
    const yOffset = -25 - breath
    
    ctx.beginPath()
    if (type === 0) { // 猫耳
      ctx.moveTo(-15, yOffset)
      ctx.lineTo(-25, yOffset - 15)
      ctx.lineTo(-5, yOffset + 5)
      
      ctx.moveTo(15, yOffset)
      ctx.lineTo(25, yOffset - 15)
      ctx.lineTo(5, yOffset + 5)
    } else if (type === 1) { // 兔耳
      ctx.ellipse(-15, yOffset - 15, 6, 20, -0.2, 0, Math.PI * 2)
      ctx.ellipse(15, yOffset - 15, 6, 20, 0.2, 0, Math.PI * 2)
    } else if (type === 2) { // 熊耳
      ctx.arc(-20, yOffset - 5, 8, 0, Math.PI * 2)
      ctx.arc(20, yOffset - 5, 8, 0, Math.PI * 2)
    } else { // 下垂耳
      ctx.ellipse(-25, yOffset + 5, 8, 15, 0.5, 0, Math.PI * 2)
      ctx.ellipse(25, yOffset + 5, 8, 15, -0.5, 0, Math.PI * 2)
    }
    ctx.fill()
    ctx.stroke()
  }

  /**
   * @param {CanvasRenderingContext2D} ctx
   * @param {number} type
   * @param {number} mood
   * @param {boolean} sick
   * @param {number} breath
   * @param {string} color
   * @param {string} highlight
   * @param {string} [action]
   */
  drawFace(ctx, type, mood, sick, breath, color, highlight, action = 'idle') {
    // 眼睛
    const eyeY = -5 + breath * 0.5
    
    if (action === 'sleep') {
       // 闭眼睡觉
       ctx.strokeStyle = color
       ctx.lineWidth = 2
       ctx.beginPath()
       // 左眼
       ctx.moveTo(-18, eyeY)
       ctx.quadraticCurveTo(-12, eyeY + 3, -6, eyeY)
       // 右眼
       ctx.moveTo(6, eyeY)
       ctx.quadraticCurveTo(12, eyeY + 3, 18, eyeY)
       ctx.stroke()
    } else if (sick) {
      // 生病眼 xx
      ctx.strokeStyle = color
      ctx.lineWidth = 2
      this.drawCross(ctx, -12, eyeY, 4)
      this.drawCross(ctx, 12, eyeY, 4)
    } else {
      // 眨眼逻辑
      const blink = Math.random() < 0.01 || (this.frame % 150 > 145)
      
      if (blink) {
        ctx.beginPath()
        ctx.moveTo(-18, eyeY)
        ctx.lineTo(-6, eyeY)
        ctx.moveTo(6, eyeY)
        ctx.lineTo(18, eyeY)
        ctx.stroke()
      } else {
        if (type === 1) { // 豆豆眼
          ctx.fillStyle = color
          ctx.beginPath()
          ctx.arc(-12, eyeY, 3, 0, Math.PI * 2)
          ctx.arc(12, eyeY, 3, 0, Math.PI * 2)
          ctx.fill()
        } else if (type === 2) { // 眯眯眼
          ctx.beginPath()
          ctx.arc(-12, eyeY, 5, Math.PI, 0)
          ctx.arc(12, eyeY, 5, Math.PI, 0)
          ctx.stroke()
        } else { // 大眼睛
          ctx.fillStyle = color
          ctx.beginPath()
          ctx.ellipse(-12, eyeY, 5, 7, 0, 0, Math.PI * 2)
          ctx.ellipse(12, eyeY, 5, 7, 0, 0, Math.PI * 2)
          ctx.fill()
          
          // 高光
          ctx.fillStyle = 'white'
          ctx.beginPath()
          ctx.arc(-10, eyeY - 2, 2, 0, Math.PI * 2)
          ctx.arc(14, eyeY - 2, 2, 0, Math.PI * 2)
          ctx.fill()
        }
      }
    }
    
    // 腮红
    ctx.fillStyle = 'rgba(255, 100, 100, 0.3)'
    ctx.beginPath()
    ctx.arc(-22, eyeY + 8, 5, 0, Math.PI * 2)
    ctx.arc(22, eyeY + 8, 5, 0, Math.PI * 2)
    ctx.fill()
    
    // 嘴巴
    ctx.strokeStyle = color
    ctx.lineWidth = 2
    ctx.beginPath()
    const mouthY = 8 + breath * 0.5
    
    if (action === 'eating') {
       // 咀嚼
       const chew = Math.abs(Math.sin(this.frame * 0.2)) * 3
       ctx.ellipse(0, mouthY, 5, 2 + chew, 0, 0, Math.PI * 2)
    } else if (sick || mood < 30) {
      // 难过
      ctx.arc(0, mouthY + 5, 4, Math.PI, 0)
    } else if (mood > 70) {
      // 开心
      ctx.arc(0, mouthY, 4, 0, Math.PI)
    } else {
      // 普通
      ctx.moveTo(-3, mouthY)
      ctx.lineTo(3, mouthY)
    }
    ctx.stroke()
  }
  
  /**
   * @param {CanvasRenderingContext2D} ctx
   * @param {number} x
   * @param {number} y
   * @param {number} size
   */
  drawCross(ctx, x, y, size) {
    ctx.beginPath()
    ctx.moveTo(x - size, y - size)
    ctx.lineTo(x + size, y + size)
    ctx.moveTo(x + size, y - size)
    ctx.lineTo(x - size, y + size)
    ctx.stroke()
  }

  /**
   * @param {CanvasRenderingContext2D} ctx
   * @param {number} type
   * @param {number} breath
   */
  drawAccessory(ctx, type, breath) {
    const y = 15 + breath
    if (type === 0) { // 领结
      ctx.fillStyle = '#ff6b6b'
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(-8, y - 5)
      ctx.lineTo(-8, y + 5)
      ctx.lineTo(0, y)
      ctx.lineTo(8, y - 5)
      ctx.lineTo(8, y + 5)
      ctx.fill()
      ctx.stroke()
    } else if (type === 1) { // 围巾
      ctx.strokeStyle = '#4ecdc4'
      ctx.lineWidth = 4
      ctx.beginPath()
      ctx.moveTo(-15, y)
      ctx.quadraticCurveTo(0, y + 10, 15, y)
      ctx.stroke()
    }
  }

  /**
   * @param {CanvasRenderingContext2D} ctx
   * @param {number} breath
   */
  drawFood(ctx, breath) {
    const y = 20 + breath
    // Simple apple/food
    ctx.fillStyle = '#ff6b6b'
    ctx.strokeStyle = '#4a4a6a'
    ctx.lineWidth = 2
    
    // Move food towards mouth
    const offset = Math.sin(this.frame * 0.2) * 5
    
    ctx.beginPath()
    ctx.arc(15 + offset, y - 5, 8, 0, Math.PI * 2)
    ctx.fill()
    ctx.stroke()
    
    // Leaf
    ctx.fillStyle = '#4ecdc4'
    ctx.beginPath()
    ctx.ellipse(15 + offset, y - 13, 3, 5, 0.5, 0, Math.PI * 2)
    ctx.fill()
  }

  /**
   * @param {CanvasRenderingContext2D} ctx
   * @param {number} breath
   */
  drawBubbles(ctx, breath) {
    ctx.strokeStyle = '#4ecdc4'
    ctx.fillStyle = 'rgba(78, 205, 196, 0.3)'
    ctx.lineWidth = 1
    
    for (let i = 0; i < 3; i++) {
        const t = (this.frame * 0.05 + i * 2) % 10
        const y = -20 - t * 5
        const x = Math.sin(t + i) * 10
        const s = (Math.sin(t) + 2) * 2
        
        if (t < 8) {
            ctx.beginPath()
            ctx.arc(x, y, s, 0, Math.PI * 2)
            ctx.fill()
            ctx.stroke()
        }
    }
    
    // Sponge/Brush
    const bx = Math.sin(this.frame * 0.1) * 20
    ctx.fillStyle = '#ffe66d'
    ctx.strokeStyle = '#4a4a6a'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.rect(bx - 10, 10 + breath, 20, 15)
    ctx.fill()
    ctx.stroke()
  }

  /**
   * @param {CanvasRenderingContext2D} ctx
   * @param {number} breath
   * @param {number} direction
   */
  drawBall(ctx, breath, direction) {
    const t = this.frame * 0.1
    const x = Math.sin(t) * 30 * direction // Move left right
    const y = Math.abs(Math.cos(t)) * -30 + 30 // Bounce
    
    ctx.fillStyle = '#ff6b6b'
    ctx.strokeStyle = '#4a4a6a'
    ctx.lineWidth = 2
    
    ctx.beginPath()
    ctx.arc(x, y, 8, 0, Math.PI * 2)
    ctx.fill()
    ctx.stroke()
    
    // Stripe
    ctx.beginPath()
    ctx.moveTo(x - 8, y)
    ctx.lineTo(x + 8, y)
    ctx.stroke()
  }
  
  /**
   * @param {CanvasRenderingContext2D} ctx
   * @param {number} breath
   */
  drawWorkIcon(ctx, breath) {
    // Briefcase
    const y = 15 + breath
    ctx.fillStyle = '#556270'
    ctx.strokeStyle = '#4a4a6a'
    ctx.lineWidth = 2
    
    ctx.beginPath()
    ctx.rect(15, y, 20, 15)
    ctx.fill()
    ctx.stroke()
    
    // Handle
    ctx.beginPath()
    ctx.moveTo(20, y)
    ctx.lineTo(20, y - 3)
    ctx.lineTo(30, y - 3)
    ctx.lineTo(30, y)
    ctx.stroke()
    
    // Sweat drop
    if (this.frame % 60 < 30) {
        ctx.fillStyle = '#4ecdc4'
        ctx.beginPath()
        ctx.arc(-25, -20 + breath, 3, 0, Math.PI * 2)
        ctx.fill()
    }
  }

  /**
   * @param {CanvasRenderingContext2D} ctx
   * @param {number} breath
   */
  drawBook(ctx, breath) {
    // Glasses
    const y = -5 + breath * 0.5
    ctx.strokeStyle = '#4a4a6a'
    ctx.lineWidth = 2
    
    ctx.beginPath()
    ctx.arc(-12, y, 6, 0, Math.PI * 2)
    ctx.arc(12, y, 6, 0, Math.PI * 2)
    ctx.moveTo(-6, y)
    ctx.lineTo(6, y)
    ctx.stroke()
    
    // Book
    const by = 25 + breath
    ctx.fillStyle = '#fff'
    ctx.strokeStyle = '#4a4a6a'
    
    ctx.beginPath()
    ctx.moveTo(-15, by)
    ctx.lineTo(15, by)
    ctx.lineTo(15, by + 10)
    ctx.lineTo(-15, by + 10)
    ctx.closePath()
    ctx.fill()
    ctx.stroke()
    
    ctx.beginPath()
    ctx.moveTo(0, by)
    ctx.lineTo(0, by + 10)
    ctx.stroke()
  }

  /**
   * @param {CanvasRenderingContext2D} ctx
   * @param {number} breath
   * @param {number} direction
   */
  drawZzz(ctx, breath, direction) {
     ctx.fillStyle = '#4a4a6a'
     ctx.font = 'bold 20px Arial'
     
     const t = (this.frame * 0.05) % 3
     const alpha = 1 - (t / 3)
     const y = -30 - t * 10
     const x = 20 * direction + Math.sin(t) * 5
     
     ctx.globalAlpha = alpha
     ctx.fillText('Z', x, y)
     ctx.font = 'bold 15px Arial'
     ctx.fillText('z', x + 10, y - 10)
     ctx.globalAlpha = 1.0
  }
}

/** @type {any} */ (window).CuteRenderer = CuteRenderer

})();
