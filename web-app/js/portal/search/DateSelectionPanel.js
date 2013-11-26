/*
 * Copyright 2012 IMOS
 *
 * The AODN/IMOS Portal is distributed under the terms of the GNU General Public License
 *
 */
Ext.namespace('Portal.search');

Portal.search.DateSelectionPanel = Ext.extend(Ext.Panel, {
    padding: 5,

    constructor:function (cfg) {
        cfg = cfg || {};

        this.titleText = cfg.title;

        if (cfg.title) cfg.title = '<span class="term-selection-panel-header">' + cfg.title + '</span>';

        if (!cfg.separator)
            cfg.separator = "|";

        var defaults = {
            collapsible:true,
            collapsed:true,
            titleCollapse:true
        };

        Ext.apply(this, cfg, defaults);

        var config = Ext.apply({
            layout:'form',
            cls:'search-filter-panel term-selection-panel',
            items:[
                this.dateRange = new Portal.search.field.FacetedDateRange(),
                //add a container to store the go button and the clear button. Display horizontally
                new Ext.Container({
                    layout: 'hbox',
                    defaults: {
                        style: {
                            padding: '2px'
                        }
                    },
                    items: [  this.goButton = new Ext.Button({
                        text:OpenLayers.i18n("goButton"),
                        width:65
                        }),
                        //add a new button to clear the selected date range
                        this.clearButton = new Ext.Button({
                            text:OpenLayers.i18n("clearButton"),
                            width:65
                        })]
                })
            ]
        }, cfg, defaults);


        Portal.search.DateSelectionPanel.superclass.constructor.call(this, config);

        //add both the go button and the clear button
        this.mon(this.goButton, 'click', this.onGo, this);
        this.mon(this.clearButton, 'click', this.clearDateRange, this);
    },

    initComponent:function () {
        Portal.search.DateSelectionPanel.superclass.initComponent.apply(this, arguments);
    },

    onGo: function() {
        var range = this.dateRange.getFilterValue();

        this.searcher.removeFilters("extFrom");
        this.searcher.removeFilters("extTo");

        var titleFrom = OpenLayers.i18n('min');
        var titleTo   = OpenLayers.i18n('max');

        if (range.fromDate !== "")
        {
            this.searcher.addFilter("extFrom", range.fromDate.format("Y-m-d"));
            titleFrom = range.fromDate.format("d/m/Y");
        }

        if (range.toDate !== "")
        {
            this.searcher.addFilter("extTo", range.toDate.format("Y-m-d"));
            titleTo = range.toDate.format("d/m/Y");
        }

        if (range.fromDate !== "" || range.toDate !== "")
        {
            var newSub = titleFrom + " - " + titleTo;
            this.setSelectedSubTitle(newSub);

            this.searcher.search();
        }
    },
    
    //clear the currently selected date range. Clear the sub-titles on the facet appropriately if a search has already been performed
    clearDateRange: function() {
        this.dateRange.clearValues();
        this.removeSelectedSubTitle();
    },

    removeAnyFilters: function() {
        this.searcher.removeFilters("extFrom");
        this.searcher.removeFilters("extTo");
        this.dateRange.clearValues();
        this.removeSelectedSubTitle();
        this.collapse();
    },

    setSelectedSubTitle: function(subtitle) {
        var newTitle = '<span class="term-selection-panel-header-selected">' + this.titleText + '</span>';
        newTitle += " - " + subtitle;
        this.setTitle(newTitle);
    },

    removeSelectedSubTitle: function() {
        var newTitle = '<span class="term-selection-panel-header">' + this.titleText + '</span>';
        this.setTitle(newTitle);
    }
});
