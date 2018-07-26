import { v1 as neo4j } from 'neo4j-driver';
import Entity from './Entity';
import Update from './Services/Update';
import Delete from './Services/Delete';
import RelateTo from './Services/RelateTo';
import RelationshipType from './RelationshipType';


/** 
 * Node Container
 */
export default class Node extends Entity {

    /**
     * @constructor
     *
     * @param  {Neode}   neode        Neode Instance
     * @param  {Model}   model        Model definition
     * @param  {Integer} identity     Internal Node ID
     * @param  {Array}   labels       Node labels
     * @param  {Object}  properties   Property Map
     * @param  {Map}     eager        Eagerly loaded values
     * @return {Node}
     */
    constructor(neode, model, identity, labels, properties, eager) {
        super();

        this._neode = neode;
        this._model = model;
        this._identity = identity;
        this._labels = labels;
        this._properties = properties || new Map;

        this._eager = eager || new Map;

        this._deleted = false;
    }

    /**
     * Get Labels
     *
     * @return {Array}
     */
    labels() {
        return this._labels;
    }

    /**
     * Set an eager value on the fly
     * 
     * @param  {String} key 
     * @param  {Mixed}  value 
     * @return {Node}
     */
    setEager(key, value) {
        this._eager.set(key, value);

        return this;
    }

    /**
     * Delete this node from the Graph
     *
     * @return {Promise}
     */
    delete() {
        return Delete(this._neode, this._identity, this._model)
            .then(() => {
                this._deleted = true;

                return this;
            });
    }

    /**
     * Relate this node to another based on the type
     *
     * @param  {Node}   node            Node to relate to
     * @param  {String} type            Type of Relationship definition
     * @param  {Object} properties      Properties to set against the relationships
     * @param  {Boolean} force_create   Force the creation a new relationship? If false, the relationship will be merged
     * @return {Promise}
     */
    relateTo(node, type, properties = {}, force_create = false) {
        const relationship = this._model.relationships().get(type);

        if ( !(relationship instanceof RelationshipType) ) {
            return Promise.reject( new Error(`Cannot find relationship with type ${type}`) );
        }

        return RelateTo(this._neode, this, node, relationship, properties, force_create);
    }

    /**
     * Convert Node to a JSON friendly Object
     *
     * @return {Promise}
     */
    toJson() {
        const output = {
            _id: this.id(),
            _labels: this.labels(),
        }

        // Properties
        this._model.properties().forEach((property, key) => {
            if ( property.hidden() ) {
                return;
            }

            if ( this._properties.has(key) ) {
                output[ key ] = this.valueToJson(property, this._properties.get( key ));
            }
        });

        // Eager Promises
        return Promise.all( this._model.eager().map((rel) => {
            const key = rel.name();

            if ( this._eager.has( rel.name() ) ) {
                // Call internal toJson function on either a Node or NodeCollection
                return this._eager.get( rel.name() ).toJson()
                    .then(value => {
                        return { key, value }
                    });
            }
        }) )
            // Remove Empty 
            .then(eager => eager.filter( e => !!e ))

            // Assign to Output
            .then(eager => {
                eager.forEach(({ key, value }) => output[ key ] = value)
                
                return output;
            });
    }
}