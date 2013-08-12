/*
 * Copyright 2013 IMOS
 *
 * The AODN/IMOS Portal is distributed under the terms of the GNU General Public License
 *
 */
describe("Portal.data.ActiveGeoNetworkRecordStore", function() {

    /**
     *  A singleton instance of the store is used to store the 'active' geonetwork records.
     */
    describe('active geonetwork records store', function() {

        var activeRecordStore;

        beforeEach(function() {
            Portal.data.ActiveGeoNetworkRecordStore.THE_ACTIVE_RECORDS_INSTANCE = undefined;
            activeRecordStore = Portal.data.ActiveGeoNetworkRecordStore.instance();
        });

        describe('activeRecordsInstance', function() {
            it('accessor function', function() {
                expect(Portal.data.ActiveGeoNetworkRecordStore.instance()).toBeTruthy();
            });

            it('singleton', function() {
                var firstCall = Portal.data.ActiveGeoNetworkRecordStore.instance();
                var secondCall = Portal.data.ActiveGeoNetworkRecordStore.instance();
                expect(firstCall).toBe(secondCall);
            });
        });

        describe('interaction with MsgBus', function() {

            var myRecord;

            beforeEach(function() {
                spyOn(Ext.MsgBus, 'publish');
                myRecord = new Portal.data.GeoNetworkRecord({
                    title: 'my record'
                });
            });

            describe('when adding/removing records', function() {
                it('geonetwork added message is fired', function() {
                    activeRecordStore.add(myRecord);
                    expect(Ext.MsgBus.publish).toHaveBeenCalledWith('activegeonetworkrecordadded', [myRecord]);
                });

                it('geonetwork removed message is fired', function() {
                    activeRecordStore.add(myRecord);

                    activeRecordStore.remove(myRecord);
                    expect(Ext.MsgBus.publish).toHaveBeenCalledWith('activegeonetworkrecordremoved', myRecord);
                });
            });
        });

        describe('interaction with LayerStore', function() {

            var layer = new OpenLayers.Layer.WMS(
                'the tile',
                'http://some/wms/url',
                {},
                { isBaseLayer: false }
            );

            describe('record with layer', function() {

                var myRecord;

                beforeEach(function() {
                    myRecord = new Portal.data.GeoNetworkRecord({
                        links: [{
                            href: 'http://somelayer/wms',
                            name: 'the name',
                            protocol: 'OGC:WMS-1.1.1-http-get-map',
                            title: 'a really interesting record',
                            type: 'some type'
                        }]
                    });
                });

                it('layer added to LayerStore', function() {
                    spyOn(Portal.data.LayerStore.instance(), 'addUsingLayerLink');

                    activeRecordStore.add(myRecord);

                    expect(Portal.data.LayerStore.instance().addUsingLayerLink).toHaveBeenCalled();
                    expect(Portal.data.LayerStore.instance().addUsingLayerLink.mostRecentCall.args[0]).toEqual(
                        myRecord.getFirstWmsLink());
                });

                it('callback adds layer record to geonetwork record', function() {
                    var layerRecord = new GeoExt.data.LayerRecord();
                    spyOn(Portal.data.LayerStore.instance(), 'addUsingLayerLink').andCallFake(
                        function(layerLink, layerRecordCallback) {
                            layerRecordCallback(layerRecord);
                        });

                    activeRecordStore.add(myRecord);

                    expect(myRecord.layerRecord).toBe(layerRecord);
                });

                it('layer removed from LayerStore', function() {
                    var layerRecord = new GeoExt.data.LayerRecord({
                        layer: layer,
                        title: layer.name
                    });
                    myRecord.layerRecord = layerRecord;
                    spyOn(Portal.data.LayerStore.instance(), 'removeUsingOpenLayer');
                    activeRecordStore.add(myRecord);

                    activeRecordStore.remove(myRecord);

                    expect(Portal.data.LayerStore.instance().removeUsingOpenLayer).toHaveBeenCalledWith(layer);
                });
            });

            describe('record without layer', function() {
                var myRecord = new Portal.data.GeoNetworkRecord({
                    title: 'a really interesting record'
                });

                it('when geonetwork record without layer is added', function() {
                    spyOn(Portal.data.LayerStore.instance(), 'addUsingLayerLink');

                    activeRecordStore.add(myRecord);

                    expect(Portal.data.LayerStore.instance().addUsingLayerLink).not.toHaveBeenCalled();
                });

                it('when geonetwork record without layer is removed', function() {
                    spyOn(Portal.data.LayerStore.instance(), 'removeUsingOpenLayer');
                    activeRecordStore.add(myRecord);

                    activeRecordStore.remove(myRecord);

                    expect(Portal.data.LayerStore.instance().removeUsingOpenLayer).not.toHaveBeenCalledWith(layer);
                });
            });

            describe('on clear', function() {
                it('all layers removed from LayerStore', function() {
                    var layerRecord = new GeoExt.data.LayerRecord({
                        layer: layer,
                        title: layer.name
                    });
                    var myRecord = new Portal.data.GeoNetworkRecord({
                        title: 'a really interesting record'
                    });
                    myRecord.layerRecord = layerRecord;

                    var layer2 = new OpenLayers.Layer.WMS(
                        'the tile',
                        'http://some/wms/url',
                        {},
                        { isBaseLayer: false });
                    var layerRecord2 = new GeoExt.data.LayerRecord({
                        layer: layer2,
                        title: layer2.name
                    });
                    var myRecord2 = new Portal.data.GeoNetworkRecord({
                        title: 'my record'
                    });

                    spyOn(activeRecordStore, '_removeFromLayerStore');
                    activeRecordStore.add(myRecord);
                    activeRecordStore.add(myRecord2);

                    activeRecordStore.removeAll();

                    expect(activeRecordStore._removeFromLayerStore.calls.length).toBe(2);
                    expect(activeRecordStore._removeFromLayerStore.calls[0].args[0]).toBe(myRecord);
                    expect(activeRecordStore._removeFromLayerStore.calls[1].args[0]).toBe(myRecord2);
                });
            });
        });

        describe('download', function() {
            it('initiateDownload makes call to server', function() {
                spyOn(Ext.Ajax, 'request');
                activeRecordStore.initiateDownload();
                expect(Ext.Ajax.request).toHaveBeenCalled();
            });

            describe('request params', function() {

                var request;

                addTestRecordsToStore = function() {
                    var firstRecord = new Portal.data.GeoNetworkRecord({
                        uuid: '111111',
                        title: 'first title',
                        links: [
                            {
                                href: 'http://host/some.html',
                                name: 'imos:radar_stations',
                                protocol: 'some protocol',
                                title: 'the first title',
                                type: 'text/html'
                            }
                        ],
                    });

                    var secondRecord = new Portal.data.GeoNetworkRecord({
                        uuid: '222222',
                        title: 'second title',
                        links: [
                            {
                                href: 'http://host/some.pdf',
                                name: 'imos:radar_stations',
                                protocol: 'some protocol',
                                title: 'the second title',
                                type: 'text/pdf'
                            }
                        ],
                    });

                    activeRecordStore.add(firstRecord);
                    activeRecordStore.add(secondRecord);
                }

                beforeEach(function() {
                    spyOn(Ext.Ajax, 'request');

                    addTestRecordsToStore();

                    activeRecordStore.initiateDownload();
                    request = Ext.Ajax.request.mostRecentCall.args[0];
                });

                it('url', function() {
                    expect(request.url).toBe('downloadCart/download');
                });

                it('success', function() {
                    expect(request.success).toBeTruthy();
                    expect(request.success).toBe(activeRecordStore._onDownloadSuccess);
                });

                it('failure', function() {
                    expect(request.failure).toBeTruthy();
                    expect(request.failure).toBe(activeRecordStore._onDownloadFailure);
                });

                describe('params', function() {
                    describe('items', function() {

                        var itemsDecoded;

                        beforeEach(function() {
                            // Decode again as comparing strings would be too brittle.
                            itemsDecoded = Ext.util.JSON.decode(request.params.items);
                        });

                        it('item per record', function() {
                            expect(itemsDecoded.length).toBe(2);
                        });

                        describe('first item', function() {
                            it('properties', function() {
                                expect(itemsDecoded[0].uuid).toBe('111111');
                                expect(itemsDecoded[0].title).toBe('first title');
                            });

                            it('links', function() {
                                expect(itemsDecoded[0].links.length).toBe(1);
                                expect(itemsDecoded[0].links[0].href).toBe('http://host/some.html');
                                expect(itemsDecoded[0].links[0].name).toBe('imos:radar_stations');
                                expect(itemsDecoded[0].links[0].protocol).toBe('some protocol');
                                expect(itemsDecoded[0].links[0].title).toBe('the first title');
                                expect(itemsDecoded[0].links[0].type).toBe('text/html');
                            });
                        });

                        describe('second item', function() {
                            it('properties', function() {
                                expect(itemsDecoded[1].uuid).toBe('222222');
                                expect(itemsDecoded[1].title).toBe('second title');
                            });
                        });
                    });
                });
            });

            describe('is downloading', function() {
                it('initially false', function() {
                    expect(activeRecordStore.isDownloading()).toBe(false);
                });

                it('true when download starts', function() {
                    activeRecordStore.initiateDownload();
                    expect(activeRecordStore.isDownloading()).toBe(true);
                });

                it('false when download succeeds', function() {
                    activeRecordStore.initiateDownload();

                    activeRecordStore._onDownloadSuccess();

                    expect(activeRecordStore.isDownloading()).toBe(false);
                });

                it('false when download fails', function() {
                    activeRecordStore.initiateDownload();

                    activeRecordStore._onDownloadFailure();

                    expect(activeRecordStore.isDownloading()).toBe(false);
                });
            });
        });
    });
});
