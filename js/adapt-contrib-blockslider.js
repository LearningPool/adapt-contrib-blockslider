/*
* adapt-contrib-blockslider
* License - http://github.com/LearningPool/adapt-contrib-blockslider/LICENSE
* Maintainers - Kevin Corry <kevinc@learningpool.com>
*/
define([
  'coreJS/adapt'
], function(Adapt) {

  function setupBlockSliderView(blockSliderArticle) {

    var BlockSliderView = Backbone.View.extend({

      className: "extension-blockslider",

      el: '.' + blockSliderArticle.get('_id'),

      events: {
        'click .blockslider-controls': 'navigateClick',
        'click .blockslider-tab': 'navigateTab'
      },

      initialize: function() {
        this.setupBlockSlider();
        this.checkDeviceLayout();
        this.render();

        _.defer(_.bind(function() {
          this.setInitialSlide();
        }, this));

        this.listenTo(Adapt, 'remove', this.remove, this);
        this.listenTo(Adapt, 'device:changed', this.checkDeviceLayout, this);
        this.listenTo(Adapt, 'device:resize', this.calculateDimensions, this);
        this.listenTo(Adapt, 'pageView:ready', this.setBlockHeight, this);

        // Listen directly to window resize also - as blockslider is added
        // to the DOM post-render, resize events on blockslider-container
        // are fired too late, so we need to pick them up right away
        $(window).on('resize', _.bind(
          function() {
            this.calculateDimensions();
          }, this)
        );
      },

      setInitialSlide: function() {
        var initialSlide = this.model.get('_blockSlider')._initial ? this.model.get('_blockSlider')._initial - 1 : 0;
        var movementSize = this.$('.blockslider-container').width();
        this.$('.blockslider').css({ 'margin-left': - (movementSize * initialSlide) });
        this.setStage(initialSlide);
      },

      render: function() {
        // Add controls to the article
        var data = this.model.toJSON();
        var template = Handlebars.templates["blockslider"];
        this.$('.article-inner').addClass('blockslider-article');
        $(template(data)).insertBefore(this.$('.blockslider-container'));
        this.$('.blockslider-tab').first().addClass('active');
        return this;
      },

      checkDeviceLayout: function() {
        if (Adapt.device.screenSize == 'small') {
          this.unwrapBlocks();
        } else if (!this.model.get('_active') && Adapt.device.screenSize != 'small') {
          this.wrapBlocks();
        }
      },

      wrapBlocks: function() {
        this.$(".block").wrapAll("<div class='blockslider' />");
        this.$(".blockslider").wrapAll("<div class='blockslider-container' />");
        this.$('.blockslider-controls-container').removeClass('blockslider-hidden');
        this.model.set('_active', true);
      },

      getAvailableBlocks: function() {
        return _.filter(this.model.getChildren().models, function(block) {
          return block.get('_isAvailable');
        });
      },

      unwrapBlocks: function() {
        this.$(".blockslider").unwrap();
        this.$(".block").unwrap();
        this.$('.blockslider-controls-container').addClass('blockslider-hidden');

        var availableBlocks = this.getAvailableBlocks();

        _.each(availableBlocks, function(availableBlock) {
          availableBlock.set('_isVisible', availableBlock.get('_previousVisibleState'));
        });

        this.model.set('_active', false);
      },

      setupBlockSlider: function() {
        var availableBlocks = this.getAvailableBlocks();

        _.each(availableBlocks, function(availableBlock) {
          // Keep a record of the state before blockSlider was initialised
          availableBlock.set('_previousVisibleState', availableBlock.get('_isVisible'));
          // Set the block to not visible first - we'll update this via setStage
          // as we progress through the blockSlider
          availableBlock.set('_isVisible', false);
        }, this);

        this.model.set('_blocks', availableBlocks);
        this.model.set('_blockCount', availableBlocks.length);

        this.wrapBlocks();
        this.calculateDimensions();
      },

      calculateDimensions: function() {
        var slideWidth = this.$('.article-body').width();
        var slideCount = this.model.get('_blockCount');
        var stage = this.model.get('_stage');
        var margin = -(stage * slideWidth);
        this.$('.blockslider-container').width(slideWidth);
        this.$('.blockslider').width(slideWidth * slideCount);
        this.$('.block').width(slideWidth);
        this.$('.blockslider').css('margin-left', margin);
      },

      navigateClick: function(event) {
        event.preventDefault();

        var stage = this.model.get('_stage');
        var movementSize = this.$('.blockslider-container').width();

        if (this.$(event.currentTarget).hasClass('blockslider-control-right')) {
          this.navigateToIndex(++stage, movementSize);
        }
        if (this.$(event.currentTarget).hasClass('blockslider-control-left')) {
          this.navigateToIndex(--stage, movementSize);
        }
      },

      navigateTab: function(event) {
        event.preventDefault();
        this.$('.blockslider-tab').removeClass('active');
        this.$(event.currentTarget).addClass('active');
        var movementSize = this.$('.blockslider-container').width();
        var currentIndex = this.$('.blockslider-tab.active').index();
        this.navigateToIndex(currentIndex, movementSize);
      },

      navigateToIndex: function(stage, movementSize) {
        if (stage < this.model.get('_blockCount') && stage >= 0) {
          this.$('.blockslider').stop().animate({ 'margin-left': - (movementSize * stage) });
          this.setStage(stage);
        }
      },

      setStage: function(stage) {
        this.model.set('_stage', stage);

        this.$('.blockslider-tab').removeClass('active');
        this.$('.blockslider-tab').eq(stage).addClass('active');

        // Set the block to visible when we navigate to it
        if (!this.model.get('_blocks')[stage].get('_isVisible')) {
          this.model.get('_blocks')[stage].set('_isVisible', true);
        }

        this.evaluateNavigation();
      },

      setBlockHeight: function() {
        // If the user has specified a fixed hieght for slider, use that,
        // otherwise css will dictate that it's auto
        if (_.isNumber(parseFloat(this.model.get('_blockSlider')._height))) {
          this.$('.blockslider-container').height(this.model.get('_blockSlider')._height);
        }
      },

      evaluateNavigation: function() {
        var currentStage = this.model.get('_stage');
        var itemCount = this.model.get('_blockCount');

        if (currentStage > 0) {
          this.$('.blockslider-control-left').removeClass('blockslider-hidden');
        } else {
          this.$('.blockslider-control-left').addClass('blockslider-hidden');
        }

        if (itemCount > 1 && currentStage != --itemCount) {
          this.$('.blockslider-control-right').removeClass('blockslider-hidden');
        } else {
          this.$('.blockslider-control-right').addClass('blockslider-hidden');
        }
      }

    });

    new BlockSliderView({ model: blockSliderArticle });
  }

  function onArticleViewPreRender(article) {
    if (!article.model.get('_blockSlider') || !article.model.get('_blockSlider')._isEnabled) {
      return;
    }

    if (!article.model.get('body')) {
      article.model.set('body', '&nbsp;');
    }
  }

  function onArticleViewPostRender(article) {
    if (!article.model.get('_blockSlider') || !article.model.get('_blockSlider')._isEnabled) {
      return;
    }

    setupBlockSliderView(article.model);
  }

  function onDataReady() {
    // do not proceed until blockslider enabled on course.json
    if (!Adapt.course.get('_blockSlider') || !Adapt.course.get('_blockSlider')._isEnabled) {
      return;
    }

    Adapt.on('articleView:preRender', onArticleViewPreRender);
    Adapt.on('articleView:postRender', onArticleViewPostRender);
  }

  Adapt.once('app:dataReady', onDataReady);

});
