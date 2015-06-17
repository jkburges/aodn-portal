## Landing Page
####Request: GET /
####Response


## Collection
####Request: GET /collection
####Response:


# Resources

Resource|URL|Description
--------|---|-----------
Landing     |GET /      | General info, links to Collection, help, license etc
Collection  |GET /collection      | The first 'n' collections.  Each collection has links to map, download.  Summary info, allowing refined search
Collection  |GET /collection?{search filters}
Collection  |GET /collection?facet.q=Measured+parameter=Biological|
Collection  |GET /collection?facet.q=Measured+parameter=Biological&from=11&to=20|
Collection  |GET /collection/{uuid}| A particular collection
Collection  |GET /collection/{uuid}?{subset filters}| e.g. GET /collection/1234?BBOX=-183.51,-3.51,-131.48,48.51&vessel_name=LIKE%Rehua%
Filter      |GET /collection/{uuid}/filter
Filter      |GET /collection/{uuid}/filter/{filter ID}
Map         |GET /collection/{uuid}/map
Download    |GET /collection/{uuid}/download|Lists download formats
Download    |GET /collection/{uuid}/download/{format}
Download    |GET /collection/{uuid}/download/csv
Download    |GET /collection/{uuid}/download/netcdf



Notes:

* drop `collection`?

# Links

/

* collection


/collection

* collection + paging + facets


/collection/{uuid}

* map
* download
* filters

