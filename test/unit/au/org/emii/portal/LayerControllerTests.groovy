package au.org.emii.portal

import grails.test.ControllerUnitTestCase
import org.codehaus.groovy.grails.web.json.JSONElement

class LayerControllerTests extends ControllerUnitTestCase {

    def validConfig = new Config( wmsScannerCallbackPassword: "pwd" )

    protected void setUp() {

        super.setUp()
    }

    protected void tearDown() {

        super.tearDown()
    }

    void testIndex() {
            this.controller.index()
            assertEquals "list", this.controller.redirectArgs["action"]
    }

    void testSaveOrUpdate() {

        String metadata = '{metaDataElement: "metaData", serverUri: "http://serverUriText.com", dataSource:"testDataSource"}'
        this.controller.params.password = "pwd"
        this.controller.params.metadata = metadata
        this.controller.params.capabilitiesData = "012345678901234567890123456789001234567890123456789012345678901234567890123456789012345678901234567890123456789"

        def server = new Server(id : 10, uri : "http://serverUriText.com", shortAcron : "A", name : "name1", type : "WMS-1.1.1", lastScanDate: null, scanFrequency : 0, disable : false, allowDiscoveries : true, opacity : 3, imageFormat : "image/png", infoFormat: 'text/html', comments : "" )
        mockDomain Server, [server]
        mockDomain Config, [validConfig]

        def mockLayer = new Layer()
        def layerServiceControl = mockFor(LayerService)
        layerServiceControl.demand.updateWithNewData(1..1) { JSONElement e, Server s, String ds -> mockLayer }
        this.controller.layerService = layerServiceControl.createMock()

        this.controller.saveOrUpdate()

        assertNotNull "Server should now have a lastScanDate", server.lastScanDate

        assertEquals "Response text should match", "Complete (saved)", controller.response.contentAsString
    }

	void testToResponseMap() {
		def data = ['a', 'b', 'c', 'd', 'e', 'f']
		def response = this.controller._toResponseMap(data, data.size())
		assertEquals data, response.data
		assertEquals data.size(), response.total
	}

	void testIsServerCollectable() {
		assertFalse this.controller._isServerCollectable(null, null)

		def server1 = new Server()
		server1.id  = 1
		assertTrue this.controller._isServerCollectable(null, server1)
		assertFalse this.controller._isServerCollectable(server1, server1)
		assertFalse this.controller._isServerCollectable(server1, null)

		def server2 = new Server()
		server2.id  = 2
		assertTrue this.controller._isServerCollectable(server1, server2)
	}

	void testCollectServer() {
		def items = []

		def server1 = new Server()
		server1.id  = 1
		def result = this.controller._collectServer(null, server1, items)
		assertEquals result, server1
		assertEquals 1, items.size()

		result = this.controller._collectServer(result, server1, items)
		assertEquals result, server1
		assertEquals 1, items.size()

		def server2 = new Server()
		server2.id  = 2
		result = this.controller._collectServer(result, server2, items)
		assertEquals result, server2
		assertEquals 2, items.size()
	}

	void testCollectLayersAndServers() {
		def servers = _buildServers(1, 4)
		def layers = []
		servers.eachWithIndex { server, i ->
			layers.addAll(_buildLayers(1 + (i * 10), server, 10))
		}

		def result = this.controller._collectLayersAndServers(layers)
		assertEquals 44, result.size()
	}

    void testGetLayerWithFilters(){
        def server1 = new Server()
        server1.id = 1

        def layer1 = new Layer()
        layer1.id = 3
        layer1.server = server1

        def filter1 = new Filter(name: "vesselName", type:  FilterTypes.String, label: "Vessel Name", filterValues: "ship1, ship2, ship3", layer: layer1)
        def filter2 = new Filter(name: "sensorType", type:  FilterTypes.String, label: "Sensor Type", filterValues: "type1, type2", layer:  layer1)

        layer1.filters = [filter1, filter2]

        mockDomain(Server, [server1])
        mockDomain(Layer, [layer1])
        mockDomain(Filter, [filter1, filter2])

        //test layer with filters
        this.controller.params.layerId = 3
        this.controller.getFiltersAsJSON()

        println this.controller.response.contentAsString

        assertEquals true, this.controller.response.contentAsString.contains("""{"label":"Vessel Name","type":"String","name":"vesselName","filterValues":"ship1, ship2, ship3","layerId":3}""")
        assertEquals true, this.controller.response.contentAsString.contains("""{"label":"Sensor Type","type":"String","name":"sensorType","filterValues":"type1, type2","layerId":3}""")
    }

    void testGetLayerWithoutFilters(){
        def server1 = new Server()
        server1.id = 1

        def layer2 = new Layer()
        layer2.id = 4
        layer2.server = server1

        mockDomain(Server, [server1])
        mockDomain(Layer, [layer2])

        //test layer WITHOUT any filters
        this.controller.params.layerId = 4
        this.controller.getFiltersAsJSON()

        def expected = "[]"
        assertEquals expected, this.controller.response.contentAsString
    }

	def _buildServers(sId, number) {
		def servers = []
		for (def i = 0; i < number; i++) {
			def server = new Server()
			server.id = sId + i
			servers.add(server)
		}
		return servers
	}

	def _buildLayers(sLayerId, server, number) {
		def layers = []
		for (def i = 0; i < number; i++) {
			def layer = new Layer()
			layer.id = sLayerId + i
			layer.server = server
			layers.add(layer)
		}
		return layers
	}
}