import {assert, expect} from 'chai';
import Model from '../src/Model';
import RelationshipType from '../src/RelationshipType';
import Property from '../src/Property';

describe('Model.js', () => {
    const instance = null;
    const name = 'ModelTest';
    const schema = {
        labels: ['Test', 'Labels'],
        uuid: {
            type: 'uuid',
            primary: true,
        },
        boolean: 'boolean',
        int: 'int',
        integer: 'integer',
        number: {
            type: 'number',
            hidden: true,
            readonly: true,
        },
        string: {
            type: 'string',
            index: true,
            unique: true,
        },
        relationship: {
            type: 'relationship',
            relationship: 'RELATIONSHIP',
            target: 'ModelTest',
            eager: true,
            alias: 'nodeattheend'
        },
        relationships: {
            type: 'relationships',
            relationship: 'RELATIONSHIPS',
            target: 'ModelTest',
            eager: false,
        },
        node: {
            type: 'node',
            relationship: 'NODE',
            target: 'ModelTest',
            eager: true,
        },
        nodes: {
            type: 'nodes',
            relationship: 'NODES',
            target: 'ModelTest',
            eager: false,
        },
    };

    const model = new Model(instance, name, schema);

    describe('::constructor', () => {
        it('should construct', () => {
            expect( model.name() ).to.equal(name);
            expect( model.labels() ).to.deep.equal(schema.labels);

            expect( model.primaryKey() ).to.deep.equal('uuid');

            // Check Properties
            const props = ['uuid', 'boolean', 'number', 'string', 'int', 'integer'];
            expect( model.properties().size ).to.equal( props.length );
            
            props.forEach(name => {
                const prop = model.properties().get(name);

                expect( prop ).to.be.an.instanceof(Property)
                expect( prop.type() ).to.equal(name);
            })
            
            // Check properties have been set
            const uuid = model.properties().get('uuid');
            expect( uuid.primary() ).to.equal(true);

            expect( model.properties().get('string').indexed() ).to.equal(true);
            expect( model.properties().get('string').unique() ).to.equal(true);

            expect( model.properties().get('number').readonly() ).to.equal(true);
            expect( model.properties().get('number').hidden() ).to.equal(true);

            expect( model.hidden() ).to.deep.equal(['number']);

            expect( model.indexes() ).to.deep.equal(['string']);

            // Check Relationships
            expect( model.relationships().size ).to.equal( 4 )

            const rels = [ 'relationship', 'relationships', 'node', 'nodes' ];

            rels.forEach(rel => {
                expect( model.relationships().get(rel) ).to.be.an.instanceof(RelationshipType)
            })

        });

        it('should guess labels and primary key', () => {
            const model = new Model(instance, name, {});

            expect( model.name() ).to.equal(name);
            expect( model.labels() ).to.deep.equal(['ModelTest']);

            expect( model.primaryKey() ).to.deep.equal('modeltest_id');
        })
    });

});