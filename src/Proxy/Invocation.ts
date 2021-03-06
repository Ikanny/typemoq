﻿import * as _ from "lodash";
import * as common from "../Common/_all";
import { ICallContext, CallType, ProxyType } from "./ICallContext";

export enum InvocationType {
    NONE, SETUP, EXECUTE
}

export abstract class BaseInvocation implements ICallContext {
    returnValue: any;
    invocationType = InvocationType.NONE;

    constructor(public readonly proxyType: ProxyType, public callType: CallType) {

    }

    abstract get args(): IArguments;
    abstract set args(value: IArguments);

    abstract get property(): IPropertyInfo;

    abstract invokeBase(): void;
}

export class MethodInvocation extends BaseInvocation {
    constructor(
        private readonly _that: Object, 
        private readonly _property: MethodInfo, 
        private _args?: IArguments,
        proxyType = ProxyType.STATIC,
        callType = CallType.FUNCTION) {
        super(proxyType, callType);
    }

    get args(): IArguments { return this._args || <any>{ length: 0, callee: null }; }
    set args(value: IArguments) { this._args = value; }

    get property(): IPropertyInfo { return this._property; }

    invokeBase(): void {
        let thatClone = {};
        if (this._that)
            common.Utils.clone(thatClone, this._that);
        else
            thatClone = this._property.obj;
        this.returnValue = this._property.toFunc.apply(thatClone, this._args);
    }

    toString(): string {
        let res = `${this.property}(${common.Utils.argsName(this.args)})`;
        return res;
    }
}

export class ValueGetterInvocation extends BaseInvocation {
    constructor(
        private readonly _property: IPropertyInfo, 
        readonly value: any,
        proxyType = ProxyType.STATIC,
        callType = CallType.PROPERTY) {
        super(proxyType, callType);
        this.returnValue = value;
    }

    get args(): IArguments {
        let args: any[] = [];
        Object.defineProperty(args, "callee",
            { configurable: true, enumerable: true, writable: false, value: null });
        return <any>args;
    }
    set args(value: IArguments) { }

    get property(): IPropertyInfo { return this._property; }

    invokeBase(): void {
        this.returnValue = (<any>this._property.obj)[this._property.name];
    }

    toString(): string {
        let res = `${this.property}`;
        return res;
    }
}

export class DynamicGetInvocation extends ValueGetterInvocation {
    constructor(
        property: IPropertyInfo,
        value: any) {
        super(property, value, ProxyType.DYNAMIC, CallType.UNKNOWN);
        this.returnValue = value;
    }
}

export class ValueSetterInvocation extends BaseInvocation {
    constructor(
        private readonly _property: IPropertyInfo, 
        private _args: IArguments,
        proxyType = ProxyType.STATIC,
        callType = CallType.PROPERTY) {
        super(proxyType, callType);
    }

    get args(): IArguments { return this._args; }
    set args(value: IArguments) { this._args = value; }

    get property(): IPropertyInfo { return this._property; }

    invokeBase(): void {
        (<any>this._property.obj)[this._property.name] = this._args[0];
        this.returnValue = (<any>this._property.obj)[this._property.name];
    }

    toString(): string {
        let res = `${this.property} = ${common.Utils.argsName(this.args[0])}`;
        return res;
    }
}

export class MethodGetterInvocation extends BaseInvocation {
    constructor(
        private readonly _property: IPropertyInfo, 
        private readonly _getter: () => any,
        proxyType = ProxyType.STATIC,
        callType = CallType.FUNCTION) {
        super(proxyType, callType);
    }

    get args(): IArguments {
        let args: any[] = [];
        Object.defineProperty(args, "callee",
            { configurable: true, enumerable: true, writable: false, value: null });
        return <any>args;
    }
    set args(value: IArguments) { }

    get property(): IPropertyInfo { return this._property; }

    invokeBase(): void {
        this.returnValue = (<any>this._property.obj)[this._property.name];
    }

    toString(): string {
        let res = `${this.property}`;
        return res;
    }
}

export class MethodSetterInvocation extends BaseInvocation {
    constructor(
        private readonly _property: IPropertyInfo, 
        private readonly _setter: (v: any) => void, 
        private _args: IArguments,
        proxyType = ProxyType.STATIC,
        callType = CallType.FUNCTION) {
        super(proxyType, callType);
    }

    get args(): IArguments { return this._args; }
    set args(value: IArguments) { this._args = value; }

    get property(): IPropertyInfo { return this._property; }

    invokeBase(): void {
        (<any>this._property.obj)[this._property.name] = this._args[0];
        this.returnValue = (<any>this._property.obj)[this._property.name];
    }

    toString(): string {
        let res = `${this.property}(${common.Utils.argsName(this.args[0])})`;
        return res;
    }
}

export class MethodInfo implements IPropertyInfo {
    constructor(
        public readonly obj: any, 
        public readonly name: string, 
        public readonly desc?: common.PropDescriptor) {
    }

    get toFunc(): Function {
        let func: Function;
        if (_.isFunction(this.obj))
            func = <Function>this.obj;
        else
            func = <Function>this.obj[this.name];
        return func;
    }

    toString(): string {
        let objName = common.Utils.objectName(this.obj);
        let res = `${objName}.${this.name}`;
        return res;
    }
}

export class PropertyInfo implements IPropertyInfo {
    constructor(
        public readonly obj: Object, 
        public readonly name: string, 
        public readonly desc?: common.PropDescriptor) {
    }

    toString(): string {
        let objName = common.Utils.objectName(this.obj);
        let res = `${objName}.${this.name}`;
        return res;
    }
}

export interface IPropertyInfo {
    obj: Object;
    name: string;
    desc?: common.PropDescriptor;
}
