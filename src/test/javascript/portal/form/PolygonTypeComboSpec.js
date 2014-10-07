/*
 * Copyright 2013 IMOS
 *
 * The AODN/IMOS Portal is distributed under the terms of the GNU General Public License
 *
 */

describe('Portal.form.PolygonTypeCombo', function() {

    var mockMap;
    var polygonTypeCombo;

    beforeEach(function() {
        mockMap = {
            setSpatialConstraintStyle: jasmine.createSpy(),
            getSpatialConstraintType: jasmine.createSpy(),
            events: {
                on: jasmine.createSpy()
            }
        };

        polygonTypeCombo = new Portal.form.PolygonTypeComboBox({
            map: mockMap
        });
    });

    describe('items', function() {
        it('has a bounding box item', function() {
            expect(polygonTypeCombo.store.find('value', Portal.ui.openlayers.SpatialConstraintType.BOUNDING_BOX)).toBeGreaterThan(-1);
        });

        it('has a polygon item', function() {
            expect(polygonTypeCombo.store.find('value', Portal.ui.openlayers.SpatialConstraintType.POLYGON)).toBeGreaterThan(-1);
        });

    });

    describe('polygon combo box', function() {
        it('subscribes to a spatial constraint type change event', function() {
            expect(mockMap.events.on).toHaveBeenCalledWith({
                scope: polygonTypeCombo,
                'spatialconstrainttypechanged': polygonTypeCombo._updateValue
            });
        });
    });

    describe('setting spatial constraint', function() {
        it('calls setSpatialConstraintStyle when the value is set', function() {
            polygonTypeCombo.setValue('none');
            expect(mockMap.setSpatialConstraintStyle).toHaveBeenCalled();
        });
    });
});
