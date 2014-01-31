/*
* adapt-contrib-blockslider
* License - http://github.com/adaptlearning/adapt_framework/LICENSE
* Maintainers - Kevin Corry <kevinc@learningpool.com>
*/
define(function(require) {

  var Adapt = require('coreJS/adapt');

  function setupBlockSliderView (blockSliderArticle) {

    var BlockSliderView = Backbone.View.extend({

      className: "extension-blockslider",

      el: '.' + blockSliderArticle.get('_id'),

      events: {
        'click .blockslider-controls' : 'navigateClick',
        'click .blockslider-tab' : 'navigateTab'
      },

      initialize: function() {
        this.setupBlockSlider();
        this.render();
        this.checkDeviceLayout();
        
        _.defer(_.bind(function() {
           this.setStage(this.model.get('_stage') || 0);
        }, this));
        
        this.listenTo(Adapt, 'remove', this.remove, this);
        this.listenTo(Adapt, 'device:resize', this.calculateWidths, this);
        this.listenTo(Adapt, 'device:changed', this.checkDeviceLayout, this);
      },

      render: function () {
        // Add controls to the article
        var data = this.model.toJSON();
        var template = Handlebars.templates["blockslider"];
        this.$('.article-inner').addClass('blockslider-article');
        $(template(data)).insertBefore(this.$('.blockslider-container'));
        this.$('.blockslider-tab').first().addClass('active');
        return this;
      },

      checkDeviceLayout: function() {
        if (this.model.get('_active') && Adapt.device.screenSize == 'small') {
          this.unwrapBlocks();
        } else if (!this.model.get('_active') && Adapt.device.screenSize != 'small') {
          this.wrapBlocks();
        }
      },

      wrapBlocks: function() {
        this.$(".block").wrapAll( "<div class='blockslider' />");
        this.$(".blockslider").wrapAll("<div class='blockslider-container' />");
        this.$('.blockslider-controls-container').removeClass('blockslider-hidden');
        this.model.set('_active', true);
      },

      unwrapBlocks: function() {
        this.$(".blockslider").unwrap();
        this.$(".block").unwrap();
        this.$('.blockslider-controls-container').addClass('blockslider-hidden');
        this.model.set('_active', false);
      },

      setupBlockSlider: function() {
        var slideCount = this.model.getChildren().length;
        this.model.set('_blocks', this.model.getChildren().models);
        this.model.set('_blockCount', slideCount);

        this.wrapBlocks();
        this.calculateWidths();
      },

      calculateWidths: function() {
        var slideWidth = this.$('.article-body').width();
        var slideCount = this.model.get('_blockCount');
        var stage = this.model.get('_stage');
        var margin = -(stage * slideWidth);
        this.$('.blockslider-container').width(slideWidth);
        this.$('.blockslider').width(slideWidth * slideCount);
        this.$('.block').width(slideWidth);
        this.$('.blockslider').css('margin-left', margin);
      },

      navigateClick: function (event) {
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

      navigateTab: function (event) {
        event.preventDefault();
        this.$('.blockslider-tab').removeClass('active');
        this.$(event.currentTarget).addClass('active');
        var movementSize = this.$('.blockslider-container').width();
        var currentIndex = this.$('.blockslider-tab.active').index();
        this.navigateToIndex(currentIndex, movementSize);
      },

      navigateToIndex: function(stage, movementSize) {
        if (stage < this.model.get('_blockCount') && stage >= 0) {
          this.$('.blockslider').stop().animate({'margin-left': - (movementSize * stage)});
          this.setStage(stage);
        }
      },

      setStage: function(stage) {
        this.model.set('_stage', stage);
        
        this.$('.blockslider-tab').removeClass('active');
        this.$('.blockslider-tab').eq(stage).addClass('active');

        // Update the height of the slide to match the contents
        this.$('.blockslider-container').height(this.$('.block').eq(stage).height());
        
        this.evaluateNavigation();
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

    new BlockSliderView({model: blockSliderArticle});
  }

  Adapt.on('pageView:ready', function(pageView) {

    var availableArticles = pageView.model.getChildren();
    var sliderArticles = _.filter(availableArticles.models, function(article) {
        return article.get('_blockSlider');
    });

    if (sliderArticles.length > 0) {
      _.each(sliderArticles, function(article) {
        setupBlockSliderView(article);
      }, this);
    }
  });

});
