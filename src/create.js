import ResizeObserver from 'resize-observer-polyfill';
import clone from './clone.js';
import ctors from './constructors.js';

function render(createElement) {
  return createElement('div');
}

export default function create(name, Highcharts) {
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
      this.chart.destroy();
	  this.resizeObserver.disconnect();
    },
    methods: {
      $_h_render: function () {
		var me = this.chart;
        me = ctor(this.$el, clone(this.options));
		
		var reflowChart = function() {
			me.reflow();
		};
		this.resizeObserver = new ResizeObserver(function() {
			return reflowChart();
		});
		this.resizeObserver.observe(this.$el);
      }
    },
    render: render
  };
}
