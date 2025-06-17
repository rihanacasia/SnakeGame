  let nomeJogador = '';
  document.getElementById('form-nome').addEventListener('submit', function (e) {
    e.preventDefault();
    nomeJogador = document.getElementById('nome').value.trim();
    if(nomeJogador === '') return alert('Por favor, digite seu nome');
    document.querySelector('.container').style.display = 'none';
    iniciarJogo();
  });

  function iniciarJogo() {
    const config = {
      type: Phaser.AUTO,
      width: 600,
      height: 600,
      backgroundColor: '#1d1d1d',
      physics: {
        default: 'arcade',
        arcade: {
          debug: false,
        },
      },
      scene: {
        preload,
        create,
        update,
      },
    };

    new Phaser.Game(config);
  }

  // Variáveis do jogo
  let snake;
  let food;
  let cursors;
  let velocidade = 150;
  let moveTimer = 0;
  let score = 0;
  let scoreText;
  let direction = 'RIGHT';
  let newDirection = 'RIGHT';
  let gameAtivo = true;

  function preload() {
    // Não precisamos de assets gráficos, tudo vai ser retângulos
  }

  function create() {
    // Configuração inicial
    cursors = this.input.keyboard.createCursorKeys();

    // Criar a cobra como um grupo de retângulos (sprites)
    snake = this.physics.add.group();

    // Inicialmente com 3 segmentos
    for(let i=0; i<3; i++) {
      let segment = this.add.rectangle(150 - i*20, 150, 20, 20, 0x00ff00);
      this.physics.add.existing(segment);
      segment.body.setCollideWorldBounds(true);
      segment.body.setImmovable(true);
      snake.add(segment);
    }

    // Criar a comida
    food = this.add.rectangle(300, 300, 20, 20, 0xff0000);
    this.physics.add.existing(food);

    // Pontuação
    score = 0;
    scoreText = this.add.text(10, 10, `Jogador: ${nomeJogador} | Pontuação: 0`, {
      fontSize: '20px',
      fill: '#fff',
    });

    // Limites do mundo
    this.physics.world.setBounds(0, 0, 600, 600);
  }

  function update(time) {
    if(!gameAtivo) return;

    // Controla direção pela tecla (sem inverter o movimento da cobra)
    if (cursors.left.isDown && direction !== 'RIGHT') newDirection = 'LEFT';
    else if (cursors.right.isDown && direction !== 'LEFT') newDirection = 'RIGHT';
    else if (cursors.up.isDown && direction !== 'DOWN') newDirection = 'UP';
    else if (cursors.down.isDown && direction !== 'UP') newDirection = 'DOWN';

    // Movimento a cada 150 ms (velocidade)
    if(time > moveTimer) {
      moveTimer = time + velocidade;
      moveSnake(this);
    }
  }

  function moveSnake(scene) {
    direction = newDirection;
    // Pega a posição da cabeça atual
    const head = snake.getChildren()[0];
    let newX = head.x;
    let newY = head.y;

    if(direction === 'LEFT') newX -= 20;
    else if(direction === 'RIGHT') newX += 20;
    else if(direction === 'UP') newY -= 20;
    else if(direction === 'DOWN') newY += 20;

    // Verifica colisão com borda
    if(newX < 0 || newX >= 600 || newY < 0 || newY >= 600) {
      gameOver(scene);
      return;
    }

    // Verifica colisão com o próprio corpo
    for(let i=1; i<snake.getLength(); i++) {
      let segment = snake.getChildren()[i];
      if(segment.x === newX && segment.y === newY) {
        gameOver(scene);
        return;
      }
    }

    // Mover segmentos do corpo para posição do segmento anterior (do fim para o começo)
    for(let i = snake.getLength()-1; i > 0; i--) {
      let segment = snake.getChildren()[i];
      let prev = snake.getChildren()[i-1];
      segment.x = prev.x;
      segment.y = prev.y;
    }

    // Move cabeça para a nova posição
    head.x = newX;
    head.y = newY;

    // Verifica se comeu a comida
    if (
  Phaser.Math.Distance.Between(head.x, head.y, food.x, food.y) < 20
) {

      // Aumenta a cobra
      let tail = snake.getChildren()[snake.getLength()-1];
      let newSegment = scene.add.rectangle(tail.x, tail.y, 20, 20, 0x00ff00);
      scene.physics.add.existing(newSegment);
      newSegment.body.setImmovable(true);
      snake.add(newSegment);

      score += 10;
      velocidade = Math.max(50, velocidade - 5); // Aumenta velocidade, mas com limite mínimo

      scoreText.setText(`Jogador: ${nomeJogador} | Pontuação: ${score}`);

      // Posiciona nova comida em lugar aleatório, alinhado a grade 20x20
      let newFoodPosition = getRandomFoodPosition(snake);
      food.x = newFoodPosition.x;
      food.y = newFoodPosition.y;
    }
  }

  function getRandomFoodPosition(snakeGroup) {
    let position;
    let collision;

    do {
      position = {
        x: Phaser.Math.Between(0, 29) * 20,
        y: Phaser.Math.Between(0, 29) * 20
      };
      collision = false;

      snakeGroup.getChildren().forEach(segment => {
        if(segment.x === position.x && segment.y === position.y) {
          collision = true;
        }
      });
    } while(collision);

    return position;
  }

  function gameOver(scene) {
    gameAtivo = false;

    // Mostrar mensagem
    scene.add.text(150, 280, 'Game Over', {
      fontSize: '48px',
      fill: '#fff',
    });

    scene.add.text(100, 340, `Pontuação Final: ${score}`, {
      fontSize: '24px',
      fill: '#fff',
    });

    salvarRanking(nomeJogador, score);
  }

  function salvarRanking(nome, pontuacao) {
    const ranking = JSON.parse(localStorage.getItem('ranking-snake')) || [];
    ranking.push({ nome, pontuacao });
    ranking.sort((a,b) => b.pontuacao - a.pontuacao);
    localStorage.setItem('ranking-snake', JSON.stringify(ranking.slice(0,5)));
  }
