(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('highcharts'), require('resize-observer-polyfill'), require('lodash/isEmpty')) :
  typeof define === 'function' && define.amd ? define(['exports', 'highcharts', 'resize-observer-polyfill', 'lodash/isEmpty'], factory) :
  (global = global || self, factory(global.VueHighcharts = {}, global.Highcharts, global.ResizeObserver, global.isEmpty));
}(this, function (exports, HighchartsOnly, ResizeObserver, isEmpty) { 'use strict';

  HighchartsOnly = HighchartsOnly && HighchartsOnly.hasOwnProperty('default') ? HighchartsOnly['default'] : HighchartsOnly;
  ResizeObserver = ResizeObserver && ResizeObserver.hasOwnProperty('default') ? ResizeObserver['default'] : ResizeObserver;
  isEmpty = isEmpty && isEmpty.hasOwnProperty('default') ? isEmpty['default'] : isEmpty;

  var ctors = {
    Highcharts: 'chart',
    Highstock: 'stockChart',
    Highmaps: 'mapChart',
    HighchartsGantt: 'ganttChart',
  };

  // eslint-disable-next-line consistent-return
  function clone(obj) {
    var copy;
    if (obj === null || typeof obj !== 'object') {
      return obj;
    }
    if (obj instanceof Array) {
      copy = [];
      for (var i = obj.length - 1; i >= 0; i--) {
        copy[i] = clone(obj[i]);
      }
      return copy;
    }
    /* istanbul ignore else */
    if (obj instanceof Object) {
      copy = {};
      for (var key in obj) {
        copy[key] = clone(obj[key]);
      }
      return copy;
    }
  }

  function render(createElement) {
    return createElement('div');
  }

  function create(name, Highcharts) {
    var ctor = Highcharts[ctors[name]];
    if (!ctor) {
      return Highcharts.win
        ? null
        // When running in server, Highcharts will not be instanced,
        // so there're no constructors in Highcharts,
        // to avoid unmated content during SSR, it returns minimum component.
        : { render: render };
    }
    return {
      name: name,
      props: {
        options: { type: Object, required: true }
      },
  	data: function() {
  		return {
  			resizeObserver: null
  		};
  	},
      watch: {
        options: {
          handler: function () {
            this.$_h_render();
          },
          deep: true
        }
      },
      mounted: function () {
        this.$_h_render();
      },
      beforeDestroy: function () {
        // chart가 null인 경우에 대해 에러가 발생하여 아래에 해당 부분 처리가 되어 있는 destroy 메소드를 호출
        this.destroy();
      },
      methods: {
        $_h_render: function () {
          this.destroy();
  		    var me = this;
          me.chart = ctor(me.$el, clone(me.options));
          // add resizeObserver
          me.resizeObserver = new ResizeObserver(function() {
            if (!isEmpty(me.chart)) {
              me.chart.reflow();
            }
          });
          me.resizeObserver.observe(me.$el);
        },
        // 차트 옵션이 변경될 때마다 차트를 새로 생성하는 바람에 
        // 1초마다 데이터가 변경되는 트랜잭션 분포(X-view)에서 지속적인 메모리 누수가 발생 (덤프로 확인)
        // 기존에 생성되었던 차트와 resizeObserver가 있다면 destroy와 disconnect 후 새로 생성
        destroy: function() {
          if (this.chart != null) {
            this.chart.destroy();
          }
          if (this.resizeObserver != null) {
            this.resizeObserver.disconnect();
          }

          this.chart = null;
          this.resizeObserver = null;
        },
      },
      render: render
    };
  }

  function install(Vue, options) {
    var Highcharts = (options && options.Highcharts) || HighchartsOnly;
    for (var name in ctors) {
      var component = create(name, Highcharts);
      component && Vue.component(name, component);
    }
  }

  if (typeof window !== 'undefined' && window.Vue && window.Highcharts) {
    install(window.Vue, window.Highcharts);
  }

  exports.default = install;
  exports.genComponent = create;

  Object.defineProperty(exports, '__esModule', { value: true });

}));
