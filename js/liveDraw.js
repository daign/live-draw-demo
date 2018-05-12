liveDraw = {};
liveDraw.SVGNS = 'http://www.w3.org/2000/svg';
liveDraw.XLink = 'http://www.w3.org/1999/xlink';

liveDraw.Point = function ( parent, position, color, isFirst ) {
  this.parent = parent;

  this.node = document.createElementNS( liveDraw.SVGNS, 'circle' );
  this.node.setAttribute( 'r', 18 );
  this.node.style.fill = color;
  this.node.setAttribute( 'class', 'controlPoint' );
  this.parent.pointsNode.appendChild( this.node );

  this.touchNode = document.createElementNS( liveDraw.SVGNS, 'circle' );
  this.touchNode.setAttribute( 'r', 40 );
  this.touchNode.setAttribute( 'class', 'touchPoint' );
  this.parent.pointsNode.appendChild( this.touchNode );

  this.aText = document.createElementNS( liveDraw.SVGNS, 'text' );
  if (isFirst) {
    this.aText.setAttribute( 'class', 'aText' );
    this.aText.textContent = 'A';
    this.parent.pointsNode.appendChild( this.aText );
  }

  this.position = position.clone();

  var self = this;
  var snapshot = undefined;
  var onMove = function () {
    self.update();
    self.parent.parent.update();
  };
  this.position.addListener( onMove );
  this.update();

  var handleSettings = {
    beginning: function ( event ) {
      snapshot = self.position.clone();
      return true;
    },
    continuing: function () {
      self.position.copy( snapshot.clone().add(
        this.vectorT.sub( this.vector0 )
      ) );
    },
    ending: function () {},
    clicked: function () {},
    vector0: new Vector2(),
    vectorT: new Vector2()
  };
  handleSettings.domNode = this.touchNode;
  var myHandle = new Handle( handleSettings );
}

liveDraw.Point.prototype = {
	constructor: liveDraw.Point,
  update: function() {
    var x = this.position.x;
    var y = this.position.y;
    this.node.setAttribute( 'cx', x );
    this.node.setAttribute( 'cy', y );
    this.touchNode.setAttribute( 'cx', x );
    this.touchNode.setAttribute( 'cy', y );
    this.aText.setAttribute( 'x', x - 9 );
    this.aText.setAttribute( 'y', y + 9 );
  }
};

liveDraw.Line = function ( p1, p2, color ) {
  this.node = document.createElementNS( liveDraw.SVGNS, 'line' );
  this.node.setAttribute( 'x1', p1.position.x );
  this.node.setAttribute( 'y1', p1.position.y );
  this.node.setAttribute( 'x2', p2.position.x );
  this.node.setAttribute( 'y2', p2.position.y );
  this.node.style.stroke = color;
  this.node.setAttribute( 'class', 'controlLine' );
}

liveDraw.Line.prototype = {
	constructor: liveDraw.Line
};

liveDraw.Wire = function ( parent, color) {
  this.parent = parent;
  this.color = color;
  this.points = [];
  this.lines = [];
  this.pointsNode = document.createElementNS( liveDraw.SVGNS, 'g' );
  this.linesNode = document.createElementNS( liveDraw.SVGNS, 'g' );
  this.parent.node.appendChild( this.linesNode );
  this.parent.node.appendChild( this.pointsNode );
}

liveDraw.Wire.prototype = {
	constructor: liveDraw.Wire,
  addPoint: function ( position ) {
    var isFirst = this.points.length === 0;
    var point = new liveDraw.Point( this, position, this.color, isFirst );
    this.points.push( point );
  },
  updateLines: function () {
    while ( this.linesNode.firstChild ) {
      this.linesNode.removeChild( this.linesNode.firstChild );
    }
    this.lines = [];

    for (var i = 1; i < this.points.length; i++) {
      var line = new liveDraw.Line( this.points[i-1], this.points[i], this.color );
      this.linesNode.appendChild( line.node );
      this.lines.push( line );
    }
  }
};

liveDraw.Application = function ( container ) {
  this.wires = [];
  this.activeWire = null;

  this.colorIndex = 0;
  this.colors = [
    '#493d7e', '#3d797a', '#42a57a', '#2ab0e1', '#7842a6'
  ];

  this.node = document.createElementNS( liveDraw.SVGNS, 'svg' );
	this.node.setAttribute( 'class', 'context' );
	this.node.setAttribute( 'xmlns:xlink', liveDraw.XLink );
	container.appendChild( this.node );

  var width = 1366;
  var height = 1024;
  this.node.style.width  = width + 'px';
  this.node.style.height = height + 'px';
  this.node.setAttribute( 'viewBox', 0 + ',' + 0 + ',' + width + ',' + height );

  var nextButton = document.createElementNS( liveDraw.SVGNS, 'rect' );
  nextButton.setAttribute( 'x', 10 );
  nextButton.setAttribute( 'y', 10 );
  nextButton.setAttribute( 'width', 280 );
  nextButton.setAttribute( 'height', 50 );
  nextButton.setAttribute( 'class', 'button' );
  this.node.appendChild( nextButton );

  var nextButtonText = document.createElementNS( liveDraw.SVGNS, 'text' );
  nextButtonText.setAttribute( 'x', 30 );
  nextButtonText.setAttribute( 'y', 45 );
  nextButtonText.setAttribute( 'class', 'buttonText' );
  nextButtonText.textContent = 'Start New Line';
  this.node.appendChild( nextButtonText );

  var self = this;

  var onNextButton = function ( event ) {
    self.activeWire = null;
    event.stopPropagation();
    event.preventDefault();
	};
  nextButton.addEventListener( 'mousedown', onNextButton, false );
  nextButton.addEventListener( 'touchstart', onNextButton, false );

  var onMouseDown = function ( event ) {
    var position = new Vector2();
    position.setFromEvent( event );
    self.addPoint( position );
		self.update();
    event.stopPropagation();
    event.preventDefault();
	};
  this.node.addEventListener( 'mousedown', onMouseDown, false );
  this.node.addEventListener( 'touchstart', onMouseDown, false );
};

liveDraw.Application.prototype = {
	constructor: liveDraw.Application,
  update: function () {
    this.wires.forEach( function ( wire ) {
			wire.updateLines();
		} );
  },
  addPoint: function ( position ) {
    if (this.activeWire === null) {
      var wire = new liveDraw.Wire( this, this.colors[this.colorIndex] );
      this.colorIndex = (this.colorIndex + 1) % 5;
      this.wires.push( wire );
      this.activeWire = wire;
    }
    this.activeWire.addPoint( position );
  }
};
