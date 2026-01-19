import React, { useState, useCallback, useEffect, useRef, useContext } from "react";
import {
    Table,
    Thead,
    Tbody,
    Tfoot,
    Tr,
    Th,
    Td,
    TableCaption,
    TableContainer,
    Tooltip,
    Container,
    Select,
    Input,
    Box,
    IconButton,
    Checkbox,
    Accordion,
    AccordionItem,
    AccordionButton,
    AccordionPanel,
    AccordionIcon, Popover, PopoverTrigger, PopoverContent, PopoverBody,
    Switch
} from "@chakra-ui/react";
import { Spin } from 'antd'
import { useTranslation } from 'react-i18next';
import { connect } from 'react-redux';
import {
    getAssignmentListFilter,
    getAssignmentByStaffUidByPage,
    getAssignmentHouseHoldContactByStaffUid,
    getAssignmentInfoListByStaffUid,
    getAssignmentDetail,
    getQuestionnaireByStaffUid,
    getOutstandingAssignmentBySrvyUID,
    getAssignmentListByStaffPositionUidByPageBasic,
    getAssignmentListByStaffPositionUidByPageTotalCount,
    getAssignmentListByStaffPositionUidByPageBasicTotalCount
} from "../../features/slices/assignmentSlice";
import { generateTableHeader, generateTableField, generatePageController } from '../../utils/tableUtils'
import { useNavigate, useLocation, useSearchParams } from "react-router-dom";
import moment from 'moment'
import './../../assets/styles/pages/leafletMap.scss';
import './../../assets/styles/pages/assignment.scss';
import LeafletMap from '../../component/LeafletMap'
import Tag from '../../component/Tag'
import { MoonIcon, SunIcon, ChevronDownIcon, ChevronUpIcon, NotAllowedIcon, CheckCircleIcon } from "@chakra-ui/icons";
import { GrFilter } from 'react-icons/gr';
import FilterForm from '../../component/FilterForm'
import { FaExternalLinkAlt, FaSleigh } from 'react-icons/fa';
import { groupBy } from "core-js/actual/array/group-by";
import { getAllData, addData } from '../../utils/idbUtils'
import uuid from 'react-uuid';
import { getItineraryPlan, updateItineraryPlan } from '../../features/slices/itineraryPlanSlice'
import { DisplayDataModal } from '../../component/DisplayDataModal'
import { getData, updateData } from '../../utils/idbUtils'
import DataForm from "../../component/DataForm"
import CreatableSelect from 'react-select/creatable';
import { AlertModal } from '../../component/AlertModal'
import { Marker, Popup } from 'react-leaflet';
import { SlidableContainer } from '../../component/SlidableContainer';
import { getEFieldCardByAssignmentGuid, getEFieldCardByStaffUid, getSegmentControlListByStaffUid, getSegmentMapCoordinateByStaffPositionUid, getSegmentMapCoordinateByStaffUid, updateEFieldCard } from '../../features/slices/eFieldCardSlice'
import { getEnquiryLogByStaffUid } from '../../features/slices/enquirySlice'
// import { SingleDatepicker } from "chakra-dayzed-datepicker";
import { Map, tileLayer, Icon, latLngBounds, LatLng, DivIcon } from 'leaflet';
import { getTimeLogByStaffUid } from '../../features/slices/timeLogSlice';
import DatePicker from 'react-date-picker'
import 'react-date-picker/dist/DatePicker.css';
import 'react-calendar/dist/Calendar.css';
import { setisLoading, triggerFetch, getDropDownList } from '../../features/slices/commonSlice';
import { ControlSaveTiles } from 'leaflet.offline';
import { loadingHandler, tokenDecoder, dataFilterByPosition } from '../../utils/networkUtils';
import { checkNet } from '../../utils/networkUtils';
import { assign, orderBy } from "lodash";
import DataTable from '../../component/DataTable';
import { HoldAssignmentButton } from './AssignmentDetail';
import { useDispatch } from 'react-redux';
import { Button } from '../../component/Button';
import ESegmentDetail from '../eFieldCard/ESegmentDetail';
import GeneralQcDetail from '../qualityCheck/GeneralQcDetail';
import { downloadAssignment, deleteAssignmentFromAssignmentGroup, deleteAssignmentGroup } from '../../features/slices/assignmentSlice';
import { getSurveyList, getSurveyRoundBySurveyUid } from '../../features/slices/surveySlice';
import LoadingContext from "../../contexts/LoadingContext";
import { useSurvey } from "../../hooks/useSurvey";
import { useLocalStorage } from "../../hooks/useLocalStorage";
import ReloadContext from "../../contexts/ReloadContext";
import { ConfirmModal1 } from '../../component/ConfirmModal1';
import { AssignmentGroup, AddAssignmentGroup } from '../../component/AssignmentGroupModal';
import { message } from "antd";
import { default as SearchableSelect } from "react-select";
import QuickViewModal from '../../component/QuickViewModal';  /** Mantis 8706 */

function Assignment(props) {
    const [tableContent, setTableContent] = useState([]);
    const {
        dispatch,
        filterData,
        needFetch,
        approverList,
        assignmentStatusList,
        appointmentModeList,
        oqStatusList,
        responsibleOfficerList,
        segmentMapTypeList,
        enumResultList,
        interviewModeList,
        assignRefuseIndList,
        pairVisitIndList,
        outstandingIndList,
        highRiskIndList,
        staffList,
        // surveyList,
        // surveyRoundList,
        segmentImageTypeList,
        AssignmentSortingList,
        preferTimeList,
        EnumerationModesList
    } = props;

    const navigate = useNavigate();
    const location = useLocation();
    let [searchParams, setSearchParams] = useSearchParams();
    const spliterRef = useRef();
    const object_key = 'GUID'
    const { setIsLoading } = useContext(LoadingContext);
    const [formContent, setFormContent] = useState(JSON.parse(searchParams.get('page')) || {
        pageSize: 10,
        page: 1,
        offSet: 0,
    });
    const [filterFormContent, setFilterFormContent] = useState(JSON.parse(searchParams.get('sc')) || {
        ASGN_STS: [
            "EIP", "FQSR", "FUI", "PE",
            "PFQSR", "PFU", "PFUI", "PPFU", "QSR"
        ],
        pFuQcInd: 'N',
        SRVY_UID: ' ',
        ...JSON.parse(searchParams.get('sc'))
    })
    const [defaultFormContent, setDefaultFormContent] = useState({
        ASGN_STS: [
            "EIP", "FQSR", "FUI", "PE",
            "PFQSR", "PFU", "PFUI", "PPFU", "QSR"
        ],
        pFuQcInd: 'N',
        SRVY_UID: ' ',
    })
    const [checkedPool, setCheckedPool] = useState([]);
    const [hasAdvanceFilter, setHasAdvanceFilter] = useState(false);
    const [selectAsgnSTSAllOption, setSelectAsgnSTSAllOption] = useState(false); //Mantis 531
    const [selectEnumRSLTAllOption, setSelectEnumRSLTAllOption] = useState(false); //Mantis 531
    const [isFilterOn, setIsFilterOn] = useState(false);
    const [markerList, setMarkerList] = useState([]);
    const [currentPosition, setCurrentPosition] = useState([22.302711, 114.177216]);
    const [expandPool, setExpandPool] = useState([]);
    const [addToItinPlanContent, setAddToItinPlanContent] = useState({
        IPLN_DT: moment().toISOString(true)
    });
    const [alertContent, setAlertContent] = useState({});
    const [zoomScale, setZoomScale] = useState(null)
    // const [surveyList, setSurveyList] = useState([]);
    // const [surveyCycleCodeList, setSurveyCycleCodeList] = useState([]);
    const [selectItineraryPlanContent, setSelectItineraryPlanContent] = useState({
        isOpen: false,
        itinPlanList: []
    })
    const [imageTableContent, setImageTableContent] = useState([]);
    const [segmentImgContent, setSegmentImgContent] = useState(null);
    const [segmentImageTableContent, setSegmentImageTableContent] = useState([]);
    const [imageFormContent, setImageFormContent] = useState({
        pageSize: 10,
        page: 1,
        offSet: 0,
    });

    const [imageContentDetail, setImageContentDetail] = useState(null);
    const [refreshTime, setRefreshTime] = useState(null)
    const [fieldTeamList, setFieldTeamList] = useState([])
    const [fieldPoolList, setFieldPoolList] = useState([])
    const [fieldOfficerCodeList, setFieldOfficerCodeList] = useState([])
    const [oriFieldOfficerCodeList, setOriFieldOfficerCodeList] = useState([])
    const [fieldOfficerNameList, setFieldOfficerNameList] = useState([])
    const [eSegmentDetail, setESegmentDetail] = useState({})
    const [assignMapData, setAssignMapData] = useState([]);
    const [displayAssignMapData, setDisplayAssignMapData] = useState([]);
    const [totalCount, setTotalCount] = useState(0);
    const [contactList, setContactList] = useState([])
    const [qcContent, setQcContent] = useState({});
    const [headerContent, setHeaderContent] = useState({});
    const [panelAction, setPanelAction] = useState({});
    const [selectedLoc, setSelectedLoc] = useState({});
    const [isInitDefaultFilter, setIsInitDefaultFilter] = useState(false);
    const [assignRefList, setAssignRefList] = useState([]);
    const [confirmContent, setConfirmContent] = useState({})
    const [selectedRecord, setSelectedRecord] = useState(null);
    const [showGroupModal, setShowUpdateGroupModal] = useState(false);
    const [showAddGroupModal, setShowAddGroupModal] = useState(false);
    const [isAssignmentGroupUpdate, setIsAssignmentGroupUpdate] = useState(false);
    const [loadSpinnerVisible, setLoadSpinnerVisible] = useState(false);
    const user = tokenDecoder();
    const { surveyList, surveyRoundList, updateSurveyID } = useSurvey(JSON.parse(searchParams.get('sc'))?.SRVY_UID ?? null)
    const { setIsRequireReload } = useContext(ReloadContext);
    const [sortingOpts, setSortingOpts] = useState([])
    const [sortType, setSortType] = useState([]);

    /** mantis 8706 */
    const [isQuickViewOpen, setIsQuickViewOpen] = useState(false);
    const [selectedAssignmentGuid, setSelectedAssignmentGuid] = useState(null);

    const ouuidRef = useRef();
    // const [debugUseMemory, setDebugUseMemory] = useState(false)
    // const isMonitorMemory = process.env.DEV_MODE == "DEV";

    const DEFAULT_ZOOM_SCALE = 17

    useEffect(() => {
        localStorage.setItem("pageName", "Assignment List");
        window.dispatchEvent(new Event('fetchPageName'))

        dispatch(getDropDownList({
                        pStaffUid: tokenDecoder().id
                    }))
    }, [])

    useEffect(() => {
        async function fetchData() {
            if (!isInitDefaultFilter && Object.keys(JSON.parse(searchParams?.get('sc')) ?? {})?.length === 0) {
                
    
                let tempFilterFormContent = filterFormContent;
                let tempDefaultFormContent = defaultFormContent;

                if (user && user.SRVY_UID) {
                    const statusListResult = await getStatusListFromApi();
                    tempFilterFormContent = { ...tempFilterFormContent, SRVY_UID: user.SRVY_UID };
                    tempDefaultFormContent = { ...tempDefaultFormContent, SRVY_UID: user.SRVY_UID };
                    if (statusListResult && statusListResult.length > 0) {
                        tempFilterFormContent = { ...tempFilterFormContent, ASGN_STS: statusListResult };
                        tempDefaultFormContent = { ...tempDefaultFormContent, ASGN_STS: statusListResult };
                    }
                }

                const menu = JSON.parse(localStorage.getItem('menu'));
                const userPosnDetail = menu.find(item => item.POSN_UID === user.position);
                ouuidRef.current = userPosnDetail.OU_UID;
                const mergedTeamList = staffList.flatMap(({ teamList = [], POOL_OU_UID }) =>
                    teamList.map(team => ({ ...team, POOL_OU_UID }))
                );

                const teamDetail = mergedTeamList.find(item => (item.POOL_OU_UID === userPosnDetail.OU_UID || item.TEAM_OU_UID === userPosnDetail.OU_UID));
                let poolOuId = null;
                let teamOuId = null;
                if (teamDetail?.TEAM_OU_UID === userPosnDetail.OU_UID) {
                    // team match case
                    poolOuId = teamDetail.POOL_OU_UID;
                    teamOuId = teamDetail.TEAM_OU_UID;
                } else if (teamDetail?.POOL_OU_UID === userPosnDetail.OU_UID) {
                    poolOuId = teamDetail.POOL_OU_UID;
                }

                if (user.isSupervisor) {
                    const fullList = staffList.flatMap(({ teamList = [] }) => teamList.flatMap(({ STF_LST = [] }) => STF_LST ?? [])).filter((item, index, self) => index === self?.findIndex(({ STF_UID }) => { return STF_UID === item.STF_UID }))
                    tempFilterFormContent = {
                        ...tempFilterFormContent,
                        POOL_OU_UID: poolOuId,
                        TEAM_OU_UID: teamOuId,
                        RESP_POSN_UID: poolOuId && teamOuId && fullList.find(item => item.STF_UID == user.id) ? user.id : undefined,
                        RESP_STF_UID: poolOuId && teamOuId && fullList.find(item => item.STF_UID == user.id) ? user.id : undefined,
                    };
                    tempDefaultFormContent = {
                        ...tempDefaultFormContent,
                        POOL_OU_UID: poolOuId,
                        TEAM_OU_UID: teamOuId,
                        RESP_POSN_UID: poolOuId && teamOuId && fullList.find(item => item.STF_UID == user.id) ? user.id : undefined,
                        RESP_STF_UID: poolOuId && teamOuId && fullList.find(item => item.STF_UID == user.id) ? user.id : undefined,
                    };
                }
                setDefaultFormContent(tempDefaultFormContent);
                setFilterFormContent(tempFilterFormContent);
                setIsInitDefaultFilter(true);
            } else {

                // for sc not null case set to init already
                const temp = JSON.parse(searchParams?.get('sc'));
                setFilterFormContent({
                    ...temp,
                    pScUid: temp.SRVY_CYCLE_UID,
                })
                setSortType(temp.sort_type)
                setHasAdvanceFilter(temp.hasAdvanceFilter)
                setIsInitDefaultFilter(true);
                //await fetchAssignData();
            }
        }

        if (!isInitDefaultFilter) {
            fetchData();
        }

        async function getStatusListFromApi() {
            if(localStorage.getItem('IS_ONLINE') == 'false')
                return [];
            const action = await dispatch(getOutstandingAssignmentBySrvyUID({
                SRVY_UID: user.SRVY_UID,
                // pSatffPositionUid: user.stf_position,
                // PageNumber: 1,
                // PageSize: 1000,
            })).unwrap();
            if (action?.status != 200 || action.data.ErrCode === 1) {
                throw new Error();
            }
            return action.data.OutstandingAssignmentStatusList.map(item => item.ASGN_STS);
        }
    }, [user.stf_no, fieldTeamList]);


    useEffect(() => {
        if (!eSegmentDetail?.assignment) return

        const asgn = eSegmentDetail.assignment

        dispatch(getSegmentMapCoordinateByStaffUid({
            pStaffUid: user.id,
            pAssignmentGuid: asgn.GUID,
        }))
            .unwrap()
            .then((response) => {
                setSegmentImageTableContent(response.data?.segmentMapImages ?? [])
            })
            .catch(() => {
                getAllData('DCP', 'eFieldCard').then(data => {
                    const result = data.find(record => record.ASGN_UID === asgn?.ASGN_UID)
                    setSegmentImageTableContent(result?.EFieldCardSegmentImageObject?.filter(item => item.MAP_TYP == "LOC") ?? [])
                })
            })
    }, [eSegmentDetail]);

    useEffect(() => {
        if (isInitDefaultFilter) {
            loadingHandler(dispatchData, setIsLoading)
            searchParams.set('page', JSON.stringify(formContent))
            setSearchParams(searchParams.toString(), { replace: true })
        }
    }, [needFetch, formContent, isInitDefaultFilter])

    useEffect(() => {
        setMarkerList(displayAssignMapData?.groupBy(item => item.BLDG_UID))

    }, [displayAssignMapData]);

    useEffect(() => {
        // getAllData('DCP', 'assignment').then(data => {
        //     const tempSurveyCycleCodeList = [];
        //     data?.filter(item => item.SRVY_UID == filterFormContent.SRVY_UID)?.map(item => {
        //         if (!tempSurveyCycleCodeList.some(listItem => listItem.value == item.SRVY_CYCLE_UID)) {
        //             tempSurveyCycleCodeList.push({
        //                 value: item.SRVY_CYCLE_UID,
        //                 label: item.SRVY_CYCLE_CODE
        //             });
        //         }
        //     })
        //     setSurveyCycleCodeList(tempSurveyCycleCodeList);
        //     setFilterFormContent(content => ({ ...content, SRVY_CYCLE_UID: null }))
        // })
        // dispatch(getSurveyRoundBySurveyUid({ pSurveyUid: filterFormContent.SRVY_UID }))
        if (surveyList.find(item => item.SRVY_UID == filterFormContent.SRVY_UID)?.SRVY_TYP == 'HH') {
            const temp = oriFieldOfficerCodeList.map((item) => {
                return {
                    label: "GHS-" + item.value,
                    value: item.value
                }
            });
            setFieldOfficerCodeList(temp)
        }
        else {
            setFieldOfficerCodeList(oriFieldOfficerCodeList)
        }

        if (isInitDefaultFilter) {
            //after init then enable this logic
            updateSurveyID(filterFormContent.SRVY_UID)
            if (!filterFormContent.pScUid) {
                setFilterFormContent(content => ({ ...content, SRVY_CYCLE_UID: null }))
            }
            //update code list display
        }

    }, [filterFormContent.SRVY_UID, surveyList])

    useEffect(() => {
        
        const poolList = staffList.find(item => item.POOL_OU_UID == filterFormContent.POOL_OU_UID);
        if(ouuidRef.current && poolList && poolList.POOL_OU_UID ==  ouuidRef.current){
            setFieldTeamList(staffList.find(item => item.POOL_OU_UID == filterFormContent.POOL_OU_UID)?.teamList?.map(item => ({ value: item.TEAM_OU_UID, label: item.TEAM_NAME_ENG })) ?? [])
        } else{
            setFieldTeamList(staffList.find(item => item.POOL_OU_UID == filterFormContent.POOL_OU_UID)?.teamList?.filter(item => item.TEAM_OU_UID == defaultFormContent.TEAM_OU_UID)?.map(item => ({ value: item.TEAM_OU_UID, label: item.TEAM_NAME_ENG })) ?? [])
        }
        
        //if(user.CFT_IND == "N"){
            //Mantis 4750
            setFieldPoolList(staffList.find(item => item.POOL_OU_UID == defaultFormContent.POOL_OU_UID)? [staffList.find(item => item.POOL_OU_UID == defaultFormContent.POOL_OU_UID)] : [])
        //} 
        
        // if(filterFormContent.POOL_OU_UID){
        //     setFilterFormContent(content => ({
        //     ...content,
        //     TEAM_OU_UID: content.POOL_OU_UID ? content.TEAM_OU_UID : null,
        //     RESP_POSN_UID: content.POOL_OU_UID ? content.RESP_POSN_UID : null,
        //     RESP_STF_UID: content.POOL_OU_UID ? content.RESP_STF_UID : null,
        // }))
        // } else{
            setFilterFormContent(content => ({
                ...content,
                TEAM_OU_UID: content.POOL_OU_UID ? content.TEAM_OU_UID : null,
                // RESP_POSN_UID: content.POOL_OU_UID ? content.RESP_POSN_UID : null, //Mantis 4785 , enabled for 4785 need further checking on 4750 after this change
                // RESP_STF_UID: content.POOL_OU_UID ? content.RESP_STF_UID : null, //Mantis 4785 , enabled for 4785 need further checking on 4750 after this change
            }))
        //}
    }, [filterFormContent.POOL_OU_UID, filterFormContent.TEAM_OU_UID])

    // useEffect(() => {
    //     if (filterFormContent.TEAM_OU_UID) {
    //         setFilterFormContent(content => ({
    //             ...content,
    //             RESP_POSN_UID: content.TEAM_OU_UID ? content.RESP_POSN_UID : null,
    //             RESP_STF_UID: content.TEAM_OU_UID ? content.RESP_STF_UID : null,
    //         }))
    //     }
    // }, [filterFormContent.TEAM_OU_UID])
    //
    // useEffect(() => {
    //     setFilterFormContent(content => ({
    //         ...content,
    //         RESP_STF_UID: content.RESP_POSN_UID ? content.RESP_POSN_UID : null,
    //     }))
    // }, [filterFormContent.RESP_POSN_UID])

    // useEffect(() => {
    //     setFilterFormContent(content => ({
    //         ...content,
    //         RESP_POSN_UID: content.RESP_STF_UID ? content.RESP_STF_UID : null,
    //     }))
    // }, [filterFormContent.RESP_STF_UID])

    useEffect(() => {
        const nameSet = [];
        const codeSet = [];
        const nameSetValues = new Set();
        const codeSetValues = new Set();


    //Mantis 4750 Start 
    try {
        //No need special handling for CFT 
        // if(user.CFT_IND == "N"){


        let poolOuId = filterFormContent.POOL_OU_UID;
        let teamOuId = filterFormContent.TEAM_OU_UID; 
        if(!filterFormContent.POOL_OU_UID || !filterFormContent.TEAM_OU_UID){
            const menu = JSON.parse(localStorage.getItem('menu'));
            const userPosnDetail = menu.find(item => item.POSN_UID === user.position);
            const mergedTeamList = staffList.flatMap(({ teamList = [], POOL_OU_UID }) =>
                teamList.map(team => ({ ...team, POOL_OU_UID }))
            );
            const teamDetail = mergedTeamList.find(item => (item.POOL_OU_UID === userPosnDetail.OU_UID || item.TEAM_OU_UID === userPosnDetail.OU_UID));           
            if (teamDetail?.TEAM_OU_UID === userPosnDetail.OU_UID) {
                // team match case
                poolOuId = teamDetail.POOL_OU_UID;
                teamOuId = teamDetail.TEAM_OU_UID;
            } else if (teamDetail?.POOL_OU_UID === userPosnDetail.OU_UID) {
                poolOuId = teamDetail.POOL_OU_UID;
            }
        }
        const poolList = staffList?.find(pool => pool.POOL_OU_UID == poolOuId)
        if(!filterFormContent.TEAM_OU_UID && ouuidRef.current && poolList && poolList.POOL_OU_UID ==  ouuidRef.current){
            staffList?.find(pool => pool.POOL_OU_UID == poolOuId)?.teamList?.forEach(team => {
                if(team.STF_LST && team.STF_LST.length > 0){
                    team.STF_LST.forEach(staff => {
                        if (!nameSetValues.has(staff.STF_UID)) {
                    nameSetValues.add(staff.STF_UID);
                    //Add Officer Code in front
                    nameSet.push({ value: staff.STF_UID, label: staff.STF_NO_GHS ? `${staff.STF_NO_GHS} ` + (staff.STF_NAME_ENG ? `${staff.STF_NAME_ENG} (${staff.POSN_CD})` : '') : '' });
                }
                if (!codeSetValues.has(staff.STF_UID)) {
                    codeSetValues.add(staff.STF_UID);
                    codeSet.push({ value: staff.STF_UID, label: staff.STF_NO?staff.STF_NO : ''  });
                }
                    })
                }            
            })
        } else {
                        staffList?.find(pool => pool.POOL_OU_UID == poolOuId)?.teamList?.find(team => team.TEAM_OU_UID == teamOuId)?.STF_LST?.forEach(staff => {
                        if (!nameSetValues.has(staff.STF_UID)) {
                            nameSetValues.add(staff.STF_UID);
                            //Add Officer Code in front
                            nameSet.push({ value: staff.STF_UID, label: staff.STF_NO_GHS ? `${staff.STF_NO_GHS} ` + (staff.STF_NAME_ENG ? `${staff.STF_NAME_ENG} (${staff.POSN_CD})` : '') : '' });
                        }
                        if (!codeSetValues.has(staff.STF_UID)) {
                            codeSetValues.add(staff.STF_UID);
                            codeSet.push({ value: staff.STF_UID, label: staff.STF_NO?staff.STF_NO : ''  });
                        }
                    })
        }     
    //Mantis 4750 End 
       
    } catch (error) {
        console.error("Error processing staffList:", error);
    }

        // Sort nameSet alphabetically by label
        try {
            nameSet.sort((a, b) => {
                if (a.label == null || a.label === undefined || b.label == null || b.label === undefined) {
                    return 0;
                }
                return a.label.localeCompare(b.label);
            });

            // Sort codeSet with numbers before letters
            codeSet.sort((a, b) => {
                const isANum = /^\d+$/.test(a.label);
                const isBNum = /^\d+$/.test(b.label);

            if (isANum && isBNum) {
                return parseInt(a.label) - parseInt(b.label);
            } else if (isANum) {
                return -1;
            } else if (isBNum) {
                return 1;
            } else {
                if (a.label == null || a.label === undefined || b.label == null || b.label === undefined) {
                    return 0;
                }
                return a.label.localeCompare(b.label);
            }
        });
    } catch (error) {
        console.error("Error sorting nameSet/codeSet:", error);
    }
    setFieldOfficerNameList(nameSet);
    setOriFieldOfficerCodeList(codeSet);
    setFieldOfficerCodeList(codeSet);
}, [staffList,filterFormContent.POOL_OU_UID,filterFormContent.TEAM_OU_UID]);    //Mantis 4750 

useEffect(() => {
        if(AssignmentSortingList && AssignmentSortingList.length > 0){
            const transformedOpts = AssignmentSortingList?.flatMap(item => [
            {
              value: `${item.value}-ASC`,
              label: `${item.label} - ASC`,
              type: item.type,
            },
            {
              value: `${item.value}-DESC`,
              label: `${item.label} - DESC`,
              type: item.type,
            },
          ]) || [];
          setSortingOpts(transformedOpts)
        }
      }, [AssignmentSortingList])

    //Mantis 531 start
    const onClickSelectAll = (type) => {
        let tempFilterFormContent = filterFormContent;

        if (type === 'asgn_sts') {
            setSelectAsgnSTSAllOption(prev => {
                const newSelectAll = !prev;
                if (newSelectAll) {
                    const fullListValue = assignmentStatusList.map(item => item.value);
                    tempFilterFormContent = { ...tempFilterFormContent, ASGN_STS: fullListValue };
                } else {
                    tempFilterFormContent = { ...tempFilterFormContent, ASGN_STS: '' };
                }
                setFilterFormContent(tempFilterFormContent);
                return newSelectAll;
            });

        } else if (type === 'enum_rslt_cd') {
            setSelectEnumRSLTAllOption(prev => {
                const newEnumStatus = !prev;
                if (newEnumStatus) {
                    const fullListValue = enumResultList.map(item => item.value);
                    tempFilterFormContent = { ...tempFilterFormContent, ENUM_RSLT_CD: fullListValue };
                } else {
                    tempFilterFormContent = { ...tempFilterFormContent, ENUM_RSLT_CD: '' };
                }
                setFilterFormContent(tempFilterFormContent);



                return newEnumStatus;
            });
        }
    };
    //Mantis 531 end

    const basicStatusList = [
        {
            label: 'Yes',
            value: 'Y',
        },
        {
            label: 'No',
            value: 'N',
        },
    ]

    const formStructure = [
        {
            title: 'Sorting type',
            //inputType: 'disorder-multi-select',
            key: 'sort_type',
            inputType: 'custome',
            cell: (content, change) => {
                            return (
                                <SearchableSelect
                                    className="disorder-multi-select"
                                    options={sortingOpts}
                                    isMulti
                                    onChange={(e) =>{   
                                        //if(filterFormContent.sort_type){
                                            const keyStore = {}; // Use a plain object instead of Map
                                        e.forEach(item => {
                                            const key = item.value.split("-")[0];
                                            keyStore[key] = item; // Store the last occurrence of each key
                                        });
                                    
                                        setSortType(e.filter(item => {
                                            const key = item.value.split("-")[0];
                                            return keyStore[key] === item; // Keep only the last occurrence
                                        }));
                                        //}
                                    }}
                                    hideSelectedOptions={false}
                                    closeMenuOnSelect={false}
                                    value={sortType}
                                />
                            );
            },       
        },
        {
            title: 'Asgn. Status (* The search process may require more time if no option is selected)',
            inputType: 'select-all-multi-select',
            key: 'ASGN_STS',
            list: assignmentStatusList,
            listLength: assignmentStatusList.length,
            selectAll: true,
            componentContent: (content) => {
                return (
                    <div className='flex'>
                        <label>Select All</label>
                        <div className='checker_wrapper'>
                            <Switch
                                isChecked={selectAsgnSTSAllOption}
                                onChange={() => onClickSelectAll('asgn_sts')}
                            />
                        </div>
                    </div>
                );
            }
        },
        {
            title: 'Tel.',
            inputType: 'input',
            key: 'TEL',
            isNumber: true,
            // colspan: 4,
        },
        {
            title: 'Enum. Status',
            inputType: 'select-all-multi-select',
            key: 'ENUM_RSLT_CD',
            list: enumResultList,
            listLength: enumResultList.length,
            selectAll: true,
            componentContent: (content) => {
                return (
                    <div className='flex'>
                        <label>Select All</label>
                        <div className='checker_wrapper'>
                            <Switch
                                isChecked={selectEnumRSLTAllOption}
                                onChange={() => onClickSelectAll('enum_rslt_cd')}
                            />
                        </div>
                    </div>
                );
            }
        },
        {
            title: 'OQ Reg. Ind.',
            inputType: 'select',
            key: 'OQ_ACCT_IND',
            list: basicStatusList,
            // colspan: 2,
        },
        {
            title: 'Refusal Ind.',
            inputType: 'select',
            key: 'RFSL_IND',
            list: assignRefuseIndList,
            // colspan: 2,
        },
        {
            title: 'Priority',
            inputType: 'range',
            key: 'ASGN_PRTY',
            min: 0,
            max: 100,
            minStep: 10
            // colspan: 2,
        },
        {
            title: 'Repeated Case Ind.',
            inputType: 'select',
            key: 'REPT_ASGN_UID',
            list: basicStatusList,
            // colspan: 2,
        },
        {
            // INTV_SESS
            title: 'No. of Total Visit',
            inputType: 'range-filter-simple',
            key: ['totalOp', 'totalNum'],
        },
        {
            // INTV_SESS == AM
            title: 'No. of Day Visit',
            inputType: 'range-filter-simple',
            key: ['dayOp', 'dayNum'],
        },
        {
            // INTV_SESS == PM
            title: 'No. of Night Visit',
            inputType: 'range-filter-simple',
            key: ['nightOp', 'nightNum'],
        },
        {
            title: 'Assignment Group',
            inputType: 'input',
            key: 'GRP_NAME',
        },
    ]

    const advancedformStructure = [
        {
            title: 'Survey',
            inputType: 'select',
            key: 'SRVY_UID',
            list: surveyList.map(({ SRVY_UID, SRVY_CD }) => ({ value: SRVY_UID, label: SRVY_CD })),
            flex: 0.5,
        },
        {
            title: 'Survey Round',
            inputType: 'select',
            key: 'SRVY_CYCLE_UID',
            list: surveyRoundList.map(({ SC_UID, SC_CD }) => ({ value: SC_UID, label: SC_CD })),
            flex: 0.5,
        },
        {
            title: 'TPU',
            inputType: 'input',
            key: 'TPU',
            // colspan: 4,
        },
        {
            title: 'SB',
            inputType: 'input',
            key: 'SB',
            // colspan: 4,
        },
        {
            title: 'Appt. Mode',
            inputType: 'select',
            key: 'LST_APPT_INTV_MDE',
            list: interviewModeList,
            // colspan: 3,
        },
        {
            title: 'Appt. Date',
            inputType: 'date',
            key: 'LST_APPT_DT_NEW',
            // colspan: 3,
        },
        // {
        //     title: 'Bookmark Ind.',
        //     inputType: 'select',
        //     key: 'BKM',
        //     list: basicStatusList,
        //     // colspan: 2,
        // },
        {
            title: 'Remarks Ind.',
            inputType: 'select',
            key: 'RemarkList',
            list: basicStatusList,
            // colspan: 2,
        },
        {
            title: 'Pair visit Ind.',
            inputType: 'select',
            key: 'PAIR_VST_IND',
            list: pairVisitIndList,
            // colspan: 2,
        },
        {
            title: 'Segment case Ind.',
            inputType: 'select',
            key: 'SEG_KEY',
            list: basicStatusList,
            // colspan: 2,
        },
        {
            title: 'SDU Ind.',
            inputType: 'select',
            key: 'SDU',
            list: basicStatusList,
            // colspan: 2,
        },
        {
            title: 'QC Ind.',
            inputType: 'select',
            key: 'pFuQcInd',
            list: basicStatusList,
            // colspan: 2,
        },
        {
            title: 'Remark For Previous Round Ind.',
            inputType: 'check',
            key: 'REPT_ASGN_RMKS_IND',
            // colspan: 2,
        },
        {
            title: 'Reallocate Ind.',
            inputType: 'check',
            key: 'pReallocInd',
            // colspan: 2,
        },
        {
            title: 'Outstanding',
            inputType: 'check',
            key: 'FLD_OS_IND',
            // colspan: 2,
        },
        {
            title: 'NFA',
            inputType: 'check',
            key: 'NFA_IND',
            // colspan: 2,
        },
        {
            title: 'NFV',
            inputType: 'check',
            key: 'NFV_IND',
            // colspan: 2,
        },
        {
            title: 'Hold',
            inputType: 'check',
            key: 'HLD_STS',
            // colspan: 2,
        },
        {
            title: 'Building CSU ID',
            inputType: 'input',
            key: 'pBldgCsuId',
            // colspan: 2,
        },
    ]

    const supervisorFormStructure = [
        {
            title: 'Field Pool',
            inputType: 'select',
            key: 'POOL_OU_UID',
            list: fieldPoolList.map(item => ({ value: item.POOL_OU_UID, label: item.POOL_NAME_ENG })), //Mantis 4750
            // colspan: 3,
        },
        {
            title: 'Field Team',
            inputType: 'select',
            key: 'TEAM_OU_UID',
            list: fieldTeamList,
            // colspan: 3,
        },
        {
            title: 'Field Officer',
            inputType: 'select',
            key: 'RESP_STF_UID',
            list: fieldOfficerNameList?.sort((a, b) => a.label.localeCompare(b.label)),  // user required to sort officer names in alphabet order
            // colspan: 3,
        },
    ]

    const imageDetailTableStructure = [
        {
            inputType: 'custome',
            key: 'IMG_BASE64',
            cell: (content) => {
                return !content.IMG_BASE64 ? '' : <img className="previewUploadImg" src={'data:image/png;base64,' + content.IMG_BASE64} />
            }
        },
        {
            header: 'Type',
            inputType: 'text-select',
            key: 'FILE_TYP',
            contentKey: 'FILE_TYP',
            targetKey: 'value',
            displayKey: 'label',
            isNumber: false,
            list: segmentMapTypeList //segmentImageTypeList
        },
        {
            header: 'Name',
            inputType: 'text',
            key: 'FILE_NAME',
        },
        {
            header: 'Remark',
            inputType: 'text-textarea',
            key: 'RMKS',//'MAP_RMKS',
        },
    ]

    const segmentImgDetailTableStructure = [
        {
            inputType: 'custome',
            key: 'Base64',
            cell: (content) => {
                return !content.Base64 ? '' : <img className="previewUploadImg" src={'data:image/png;base64,' + content.Base64} />
            }
        },
        {
            header: 'Type',
            inputType: 'text-select',
            key: 'MAP_TYP',
            contentKey: 'MAP_TYP',
            targetKey: 'value',
            displayKey: 'label',
            isNumber: false,
            list: segmentImageTypeList
        },
        {
            header: 'Name',
            inputType: 'text',
            key: 'FILE_NAME',
        },
        {
            header: 'Remark',
            inputType: 'text-textarea',
            key: 'MAP_RMKS',
        },
    ]

    const selectItineraryPlanContent_structure = [{
        header: 'Date',
        inputType: 'select',
        key: 'GUID',
        list: selectItineraryPlanContent?.itinPlanList?.map(item => ({
            value: item.GUID, label: moment(item.IPLN_DT).format('YYYY-MM-DD')
        }))
    }]

    const imageListTableStructure = [
        {
            header: 'Image Name',
            inputType: 'text',
            key: 'FILE_NAME',
        },
        {
            header: 'Image Type',
            inputType: 'text-select',
            contentKey: 'MAP_TYP',
            targetKey: 'value',
            displayKey: 'label',
            list: segmentImageTypeList,
            key: 'MAP_TYP',
        },
        {
            header: 'Image',
            inputType: 'custome',
            key: '',
            cell: (content) => {
                return <Button variant="blue" onClick={() => onClickImageDetail(content)}>View</Button>
            }
        },
    ]

    const segmentImageListTableStructure = [
        {
            header: 'Image Name',
            inputType: 'text',
            key: 'FILE_NAME',
        },
        {
            header: 'Type',
            inputType: 'text-select',
            key: 'MAP_TYP',
            contentKey: 'MAP_TYP',
            targetKey: 'value',
            displayKey: 'label',
            isNumber: false,
            list: segmentImageTypeList
        },
        {
            header: 'Remarks',
            inputType: 'text',
            key: 'MAP_RMKS',
        },
        {
            header: 'View Image',
            inputType: 'custome',
            key: '',
            cell: (content) => {
                if (content.FILE_NAME.includes(".pdf")) {
                    return (
                        <Button variant="blue" onClick={() => downloadFile(content)}>
                            Download
                        </Button>
                    );
                }
                else {
                    return <Button
                        variant="blue"
                        // isDisabled={content.STS != 'A' || content.IS_SAMP === 'Y'}
                        onClick={() => {
                            onClickImageDetail(content)
                            setSegmentImgContent(content)
                        }
                        }
                    >View</Button>
                }
            }
        },
        {
            header: 'Created Date',
            inputType: 'text-date-time',
            key: 'CRE_DT',
        },
        {
            header: 'Created By',
            inputType: 'text',
            key: 'CRE_BY_NAME_ENG',
        },
        {
            header: 'Updated Date',
            inputType: 'text-date-time',
            key: 'UPD_DT',
        },
        {
            header: 'Updated By',
            inputType: 'text',
            key: 'UPD_BY_NAME_ENG',
        },
    ]

    function downloadFile(content) {
        const link = document.createElement('a');
        link.href = 'data:application/pdf;base64,' + content.Base64;
        link.download = content.FILE_NAME;
        link.click();
    }

    const fetchDataFromLocal = async () => {
        const allData = await getAllData('DCP', 'assignment')
        const promises = allData.map(async data => {
            let eFieldCard = null
            try {
                if (data.EFieldCardObject?.[0]?.GUID) {
                    eFieldCard = await getData('DCP', 'eFieldCard', assign.EFieldCardObject?.[0]?.GUID)
                }
            } catch {

            }
            const segCoor = assign.SEG_KEY ? (await getData('DCP', 'segmentCoor', assign.SEG_UID)) : null
            return {
                ...data,
                SEG_MAP_IND: segCoor && segCoor?.EFieldCardSegmentMapCoordinateObject?.length > 0 ? 'Y' : 'N',
                SHK_MAP_IND: eFieldCard?.EFieldCardSpecificInfoImageObject && eFieldCard?.EFieldCardSpecificInfoImageObject?.filter(item => item.STS != 'D' && item.FILE_TYP == 'M')?.length > 0 ? 'Y' : 'N',
                English_Full_Address: [assign.ADDR_ENG_1, assign.ADDR_ENG_2, assign.ADDR_ENG_3, assign.ADDR_ENG_4, assign.ADDR_ENG_5].filter(add => add && add != '').join(', '),
                Chinese_Full_Address: [assign.ADDR_CHI_1, assign.ADDR_CHI_2, assign.ADDR_CHI_3, assign.ADDR_CHI_4, assign.ADDR_CHI_5].filter(add => add && add != '').join(', '),
                English_Full_Mail_Address: [assign.MAIL_ADDR_ENG_1, assign.MAIL_ADDR_ENG_2, assign.MAIL_ADDR_ENG_3, assign.MAIL_ADDR_ENG_4, assign.MAIL_ADDR_ENG_5, assign.MAIL_ADDR_ENG_6].filter(add => add && add != '').join(', '),
                Chinese_Full_Mail_Address: [assign.MAIL_ADDR_CHI_1, assign.MAIL_ADDR_CHI_2, assign.MAIL_ADDR_CHI_3, assign.MAIL_ADDR_CHI_4, assign.MAIL_ADDR_CHI_5, assign.MAIL_ADDR_CHI_6].filter(add => add && add != '').join(', '),
            }
        })
        const result = await Promise.all(promises)
        return orderBy(result, 'ASGN_UID', 'asc')
    }

    const updateForm = (key, value, type) => {
        let tempValue = {};
        if (type == 'date') {
            const dateValue = {
                'year': value.split('-')[0],
                'month': parseInt(value.split('-')[1]) - 1,
                'date': value.split('-')[2],
            }
            tempValue = {
                [key]: moment(formContent[key]).set(dateValue).toISOString(true),
            }
        } else {
            tempValue = { [key]: value === '' ? null : value }
        }

        setFormContent(prev => ({
            ...prev,
            ...tempValue,
        }));
    }

    const updateFilterForm = (key, value, type) => {
        let tempValue = {};
        if (type == 'date' && value != '') {
            const dateValue = {
                'year': value.split('-')[0],
                'month': parseInt(value.split('-')[1]) - 1,
                'date': value.split('-')[2],
            }
            tempValue = {
                [key]: moment().set(dateValue).toISOString(true),
            }
        } else {
            tempValue = { [key]: value }
        }
        setFilterFormContent({
            ...filterFormContent,
            ...tempValue,
        });
    }

    const handleAddressFilter = async () => {
        if (filterFormContent['searchText']?.trim().length || filterFormContent['searchText1']?.trim().length) {
            let tempTextPool = Array.from(filterFormContent.pAddress ? filterFormContent.pAddress : []);
            // tempTextPool.push(filterFormContent['searchText']);

            if (filterFormContent['searchText']?.trim().length) {
                setAssignRefList([...assignRefList, filterFormContent['searchText'].trim().split(/\s*,\s*/).join(', ')])
                tempTextPool.push(filterFormContent['searchText'].trim().split(/\s*,\s*/).join(', '))
            }
            if (filterFormContent['searchText1']?.trim().length) {
                tempTextPool.push(filterFormContent['searchText1'].trim().split(/\s*,\s*/).join(', '))
            }

            // setIsFilterOn(false);
            const updatedFilterForm = {
                ...filterFormContent,
                pAddress: tempTextPool,
                searchText: '',
                searchText1: '',
                hasAdvanceFilter: hasAdvanceFilter,
            }
            searchParams.set('sc', JSON.stringify(updatedFilterForm))
            setSearchParams(searchParams.toString(), { replace: true });
            setFilterFormContent(updatedFilterForm);
        }
        else {
            //update link param
            const updatedSc = {
                ...filterFormContent,
                hasAdvanceFilter: hasAdvanceFilter,
                sort_type: sortType
            }
            searchParams.set('sc', JSON.stringify(updatedSc))
            setSearchParams(searchParams.toString(), { replace: true });
        }
        onClickFilterForm()
    };

    const handleKeyDown = (event) => {
        if (event.key === 'Enter') {
            handleAddressFilter();
        }
    };

    const handleDeleteTag = async (index) => {
        let tempTextPool = Array.from(filterFormContent.pAddress);
        setAssignRefList(assignRefList.filter(item => item != tempTextPool[index]))
        tempTextPool.splice(index, 1);
        const tempFilterFormContent = {
            ...filterFormContent,
            pAddress: tempTextPool,
            searchText: '',
            hasAdvanceFilter: hasAdvanceFilter,
        }

        searchParams.set('sc', JSON.stringify(tempFilterFormContent))
        await setSearchParams(searchParams.toString(), { replace: true });
        await setFilterFormContent(tempFilterFormContent);
        //dispatch(triggerFetch());
    }

    const onClickCheckBox = (content) => {
        const tempCheckedPool = Array.from(checkedPool);
        const index = checkedPool.findIndex(item => item[object_key] == content[object_key]);
        if (index == -1) {
            setCheckedPool([
                ...checkedPool,
                content
            ])
        } else {
            tempCheckedPool.splice(index, 1)
            setCheckedPool(tempCheckedPool)
        }
    }

    const onClickAllCheckBox = () => {
        if (checkedPool.length == tableContent?.length) {
            setCheckedPool([])
        } else {
            setCheckedPool(tableContent)
        }
    }

    const onClickAddToItineraryPlanBySingle = (content) => {
        //delete assignment from Itin Plan
        if (content.ItineraryPlanObject && content.ItineraryPlanObject.filter(item => item.IPLN_STS == 'D').length > 0) {
            setSelectItineraryPlanContent({
                isOpen: true,
                itinPlanList: content.ItineraryPlanObject.filter(item => item.IPLN_STS == 'D'),
                ASGN_GUID: content.GUID
            })
        } else {
            addAssignmentToItineraryPlan(content);
        }
    }

    const onClickAddToItineraryPlanByGroup = () => {
        if ((!moment(addToItinPlanContent.IPLN_DT).isBetween(moment().subtract(7, 'days'), moment(), '[]') && !(process.env.IS_ONLINE == 'true' && localStorage.getItem('IS_ONLINE') == 'true'))) {
            setAlertContent({
                isOpen: true,
                title: 'Warning',
                msg: 'Cannot add to itinerary plan out of range while offline.',
                onClose: () => {
                    setAlertContent({
                        isOpen: false,
                        msg: '',
                        onClose: null
                    })
                }
            });
            return;
        }
        if (checkedPool.some(item => item.IPLN_UID != null)) {
            setAlertContent({
                isOpen: true,
                title: 'Warning',
                msg: 'Some assignments are already hold by some itinerary plan.',
                onClose: () => {
                    setAlertContent({
                        isOpen: false,
                        msg: '',
                        onClose: null
                    })
                }
            });
            return;
        } else if (checkedPool.length == 0) {
            setAlertContent({
                isOpen: true,
                title: 'Warning',
                msg: 'No assignment is selected.',
                onClose: () => {
                    setAlertContent({
                        isOpen: false,
                        msg: '',
                        onClose: null
                    })
                }
            });
            return;
        } else {
            addAssignmentToItineraryPlan()
        }
    }

    const onClickExpand = (content) => {
        const tempExpandPool = Array.from(expandPool);
        const index = expandPool.findIndex(item => item == content['GUID']);
        if (index == -1) {
            setExpandPool([
                ...expandPool,
                content['GUID']
            ])
        } else {
            tempExpandPool.splice(index, 1)
            setExpandPool(tempExpandPool)
        }
    }

    const handleUpdateGroupName = (record) => {
        setSelectedRecord(record)
        setShowUpdateGroupModal(true)
    }

    const handleAddGroupName = (record) => {
        if (!record || record.length === 0) {
            setAlertContent({
                isOpen: true,
                title: "Warning",
                msg: "No assignment is selected.",
                onClose: () => {
                    setAlertContent({
                        isOpen: false,
                        msg: "",
                        onClose: null,
                    });
                },
            });
            return;
        }

        setSelectedRecord(record)
        setShowAddGroupModal(true)
    }

    const handleDeleteGroup = async (content, tableContent) => {
        setConfirmContent({
            isOpen: true,
            title: 'Confirmation',
            msg: () => 'Are you sure to delete this assignment from the group?',
            onClose: () => {
                setConfirmContent({
                    isOpen: false,
                    msg: '',
                    onClose: null,
                    onConfirm: null
                })
            },
            onConfirm: async () => {
                try {
                    const currAssignmentGroupUID = content.ASGN_GRP_GUID
                    const currAssignmentUID = content.ASGN_UID

                    const tempParams = {
                        DeleteAssignmentFromAssignmentGroupItemModel: {
                            ASGN_GRP_GUID: currAssignmentGroupUID,
                            ASGN_UID: currAssignmentUID,
                        },
                    }

                    // delete single group
                    const deleteGroupResult = await dispatch(
                        deleteAssignmentFromAssignmentGroup(tempParams)
                    ).unwrap();

                    if (
                        deleteGroupResult?.status == 200 &&
                        deleteGroupResult?.data.ErrCode != 1
                    ) {
                        message.success("Delete group successfully!");
                        // close dialog
                        setConfirmContent({
                            isOpen: false,
                            msg: '',
                            onClose: null,
                            onConfirm: null
                        })

                        // refresh UI
                        const mergedTableContent = tableContent.map((item) => {
                            if(item.ASGN_UID == content.ASGN_UID) {
                                item.GRP_NAME = null;
                                item.ASGN_GRP_GUID = null;
                            }
                            return item
                        });
                
                        setTableContent(mergedTableContent);
    
                    }
                } catch (offline) {
                    try {
                        const currAssignmentGroupUID = content.ASGN_GRP_GUID
                        const currAssignmentUID = content.ASGN_UID
                        const tempParams = {
                            DeleteAssignmentFromAssignmentGroupItemModel: {
                                ASGN_GRP_GUID: currAssignmentGroupUID,
                                ASGN_UID: currAssignmentUID,
                            },
                        }
                        const allData = await getAllData("DCP", "assignment");
                        const updatedData = allData.map((item) => {
                            if (item.ASGN_UID == currAssignmentUID) {
                                return {
                                    ...item,
                                    GRP_NAME: null,
                                    ASGN_GRP_GUID: null,
                                }
                            }
                            return item;
                        })

                        // save to localstorage when online will delete in DB
                        // await checkNet(dispatch(deleteAssignmentFromAssignmentGroup(tempParams)));
                        message.success("Delete group offline successfully!");

                        // close confirm dialog
                        setConfirmContent({
                            isOpen: false,
                            msg: '',
                            onClose: null,
                            onConfirm: null
                        })

                        await addData("DCP", "assignment", updatedData, "GUID", false);

                        const mergedTableContent = tableContent.map((item) => {
                            if(item.ASGN_UID == content.ASGN_UID) {
                                item.GRP_NAME = null;
                                item.ASGN_GRP_GUID = null;
                            }
                            return item
                        });
                        // refresh UI
                        setTableContent(mergedTableContent);
    
                    } catch (offlineError) {
                        console.error("Delete group offline error", offlineError);
                        message.error("Delete group offline error", offlineError);
                    }
                }
            }
        })
    }

    const handleDeleteWholeGroup = async (content, tableContent) => {
        setConfirmContent({
            isOpen: true,
            title: 'Confirmation',
            msg: () => 'Are you sure delete these group?',
            onClose: () => {
                setConfirmContent({
                    isOpen: false,
                    msg: '',
                    onClose: null,
                    onConfirm: null
                })
            },
            onConfirm: async () => {
                try {
                    const currAssignmentGroupUID = content.ASGN_GRP_GUID
                    const currAssignmentGroupName = content.GRP_NAME

                    const tempParams = {
                        ASGN_GRP_GUID: currAssignmentGroupUID,
                    }

                    // delete single group
                    const deleteGroupsResult = await dispatch(
                        deleteAssignmentGroup(tempParams)
                    ).unwrap();

                    if (
                        deleteGroupsResult?.status == 200 &&
                        deleteGroupsResult?.data.ErrCode != 1
                    ) {
                        message.success("Delete group successfully!");
                        // close confirm dialog
                        setConfirmContent({
                            isOpen: false,
                            msg: '',
                            onClose: null,
                            onConfirm: null
                        })
                        const mergedTableContent = tableContent.map((item) => {
                            if(item.ASGN_GRP_GUID == currAssignmentGroupUID) {
                                item.GRP_NAME = null;
                                item.ASGN_GRP_GUID = null;
                            }
                            return item
                        });

                        // refresh UI
                        setTableContent(mergedTableContent);
                        await addData("DCP", "assignment", mergedTableContent, "GUID", false);

                        // close rename dialog
                        setShowUpdateGroupModal(false)
                    }
                } catch (offline) {
                    try {
                        // handle offline mode
                        const currAssignmentGroupUID = content.ASGN_GRP_GUID
                        const tempParams = {
                            ASGN_GRP_GUID: currAssignmentGroupUID,
                        }
                        const allData = await getAllData("DCP", "assignment");
                        const updatedData = allData.map((item) => {
                            if (item.ASGN_GRP_GUID === currAssignmentGroupUID) {
                                return {
                                    ...item,
                                    GRP_NAME: null,
                                    ASGN_GRP_GUID: null,
                                };
                            }
                            return item;
                        });


                        // save to localstorage when online will delete in DB
                        // await checkNet(dispatch(deleteAssignmentGroup(tempParams)));
                        message.success("Delete group offline successfully!");

                        // close confirm dialog
                        setConfirmContent({
                            isOpen: false,
                            msg: '',
                            onClose: null,
                            onConfirm: null
                        })
                        setShowUpdateGroupModal(false)

                        await addData("DCP", "assignment", updatedData, "GUID", false);

                        const mergedTableContent = tableContent.map((item) => {
                            if (item.ASGN_GRP_GUID === currAssignmentGroupUID) {
                                return {
                                    ...item,
                                    GRP_NAME: null,
                                    ASGN_GRP_GUID: null,
                                };
                            }
                            return item;
                        });
                        // refresh UI
                        setTableContent(mergedTableContent);

                        // onRefreshAssignment()
                    } catch (offlineError) {
                        console.error("Delete group offline error", offlineError);
                        message.error("Delete group offline error", offlineError);
                    }
                }
            }
        })
    }

    const generateAssignmentItem = (content, index) => {
        let vaContent = [];
        content.AssignmentDetailObject[0].RemarkList?.length > 0 && vaContent.push({ value: 'r', display_name: 'R', tooltip: 'Asgn. Remarks' });
        content.NFA_IND == "Y" && vaContent.push({ value: 'a', display_name: 'NFA', tooltip: 'No Further Action' });
        content.NFV_IND == "Y" && vaContent.push({ value: 'v', display_name: 'NFV', tooltip: 'No Field Visit' });
        content.HLD_STS == "H" && vaContent.push({ value: 'h', display_name: 'H', tooltip: 'Hold' });
        content.DF_HDL_STS == "I" && vaContent.push({ value: 'c', display_name: 'C', tooltip: 'Data Conflict' });
        (content.SubmissionVersionObject?.find(item => item.RVW_STS == 'P') || content.RVW_IND == "Y") && vaContent.push({ value: 're', display_name: 'RE', tooltip: 'Review questionnaire visual alert' });
        content.BKM_RMKS != null && content.BKM_RMKS != '' && vaContent.push({ value: 'b', display_name: 'B', tooltip: 'Bookmarked' });
        content.DLREC_STS == "A" && vaContent.push({ value: 'of_t', display_name: 'of_t', tooltip: 'Offline Record' });
        content.AssignmentDetailObject?.[0]?.LST_RND_RMKS_IND == 'Y' && vaContent.push({ value: 'r_lr', display_name: 'RLR', tooltip: 'Last Round Remarks' });

        const fieldList = [
            {
                show: true, //!!content.REPT_ASGN_UID,
                title: "Repeated",
                content: /*content.GHS_CASE_IND*/ content.REPT_ASGN_UID ? "Y" : "N",
            },
            {
                show: !!content.RESPONDENT_IND,
                title: 'Same Respondent Ind.',
                content: content.RESPONDENT_IND,
            },
            {
                show: !!content.OQ_ACCT_IND, // !!content.OQ_ACCT_IND,
                title: "OQ Reg date",
                content: (basicStatusList.find(item => item.value == content.OQ_ACCT_IND)?.label)
                    + " / " + (!content.REG_DT ? "-" : moment(content.REG_DT).format("y-MM-DD"))
                ,
            },
            {
                show: !!content.AssignmentDetailObject[0].SRCH_IND,
                title: "Search Ind.",
                content: content.AssignmentDetailObject[0].SRCH_IND,
            },
            {
                show: true,
                title: "#NC T/D/N",
                content: `${content.NCD_SUM + content.NCN_SUM}
                    /${content.NCD_SUM}
                    /${content.NCN_SUM}
                    `,
            },
            {
                show: !!content.ASGN_STS,
                title: "Asgn. Status",
                content: content.ASGN_STS //assignmentStatusList.find(item => item.value == content.ASGN_STS)?.label,
            },
            {
                show: !!content.ENUM_RSLT_CD,
                title: "Enum. Status",
                content: content.ENUM_RSLT_CD //enumResultList.find(item => item.value == content.ENUM_RSLT_CD)?.label,
            },
            // {
            //     show: !!content.BKM,
            //     title: "Bookmark Ind.",
            //     content: basicStatusList.find(item => item.value == content.BKM)?.label,
            // },
            {
                show: !!content.RFSL_IND,
                title: "Refusal Ind.",
                content: assignRefuseIndList.find(item => item.value == content.RFSL_IND)?.label,
            },
            {
                show: !!content.PAIR_VST_IND, // !!content.PAIR_VST_IND_DESCR,
                title: "Pair Visit Ind.",
                content: content.PAIR_VST_IND, // content.PAIR_VST_IND_DESCR,
            },
            {
                show: !!content.UPD_DT,
                title: "Last Enum. Date",
                content: moment(content.UPD_DT).format("YYYY-MM-DD HH:mm"),
            },
            {
                show: !!content.LST_INTV_LOG_INTV_MDE,
                title: "Last Interview Mode",
                //content: content.ENUM_MDE,
                content: interviewModeList.find(item => item.value == content.LST_INTV_LOG_INTV_MDE)?.label,
            },
            {
                show: true, //!!content.MAIN_SDU,
                title: "SDU",
                content: content.SDU_IND, //content.MAIN_SDU,
            },
            {
                show: !!content.SEG_KEY_CASE || !!content.SEG_KEY,
                title: "Segment Case / Key",
                content: (basicStatusList.find(item => item.value == content.SEG_KEY_CASE)?.label ?? "-")
                    + " / " + (!content.SEG_KEY ? "-" : content.SEG_KEY)
                ,
            },
            {
                show: !!content.BMO_IND, //!!content.BMO_LTR_IND,
                title: "BMO Ind.",
                content: content.BMO_IND, //content.BMO_LTR_IND,
            },
            {
                show: !!content.AssignmentDetailObject,
                title: "TPU/SB",
                content: (!content.AssignmentDetailObject?.[0]?.TPU ? "-" : content.AssignmentDetailObject[0].TPU)
                    + " / " + (!content.AssignmentDetailObject?.[0]?.SB ? "-" : content.AssignmentDetailObject[0].SB),
            },
            {
                show: !!content.BLDG_TYP,
                title: "Bldg. Type",
                content: content.BLDG_TYP,
            },
            {
                show: !!content.AssignmentDetailObject,
                title: "Bldg. Serial",
                content: (!content.AssignmentDetailObject?.[0]?.BLDG_SERL ? "-" : content.AssignmentDetailObject[0].BLDG_SERL)
            },
            {
                show: !!content.LQ_SERL,
                title: "LQ Serial",
                content: content.LQ_SERL,
            },
            {
                show: !!content.PSTL_IND_DESCR,
                title: "Postal Code Ind.",
                content: content.PSTL_IND_DESCR,
            },
            {
                show: !!content.ASGN_PRTY,
                title: "Priority",
                content: content.ASGN_PRTY,
            },
            {
                show: !!content.HR_IND,
                title: "HR Ind.",
                content: highRiskIndList.find(item => item.value == content.HR_IND)?.label,
            },
            {
                show: !(!content.POOL_OU_NAME_ENG && !content.TEAM_NAME_ENG && !content.Responsible_Officer_English_Name && !content.RESP_POSN_CD),
                hide: !user.isSupervisor,
                title: (!content.POOL_OU_NAME_ENG && !content.TEAM_NAME_ENG && !content.Responsible_Officer_English_Name && !content.RESP_POSN_CD)?"Responsible Officer" : '',
                // title: "Field Pool / Team / Officer Name / Officer Code",
                content: (!content.POOL_OU_NAME_ENG ? "-" : content.POOL_OU_NAME_ENG)
                    + " / " + (!content.TEAM_NAME_ENG ? "-" : content.TEAM_NAME_ENG)
                    + " / " + (!content.Responsible_Officer_English_Name ? "-" : content.Responsible_Officer_English_Name)
                    + " / " + (!content.RESP_POSN_CD ? "-" : content.RESP_POSN_CD),
            },
            {
                show: !!content.REALLOC_IND,
                title: "Reallocate Ind.",
                content: content.REALLOC_IND,
            },
            // {
            //     show: !!content.BLDG_CSUID_LST,
            //     title: "Building CSU ID",
            //     content: content.BLDG_CSUID_LST,
            // },
            {
                show: !!content.LST_CONT_PREF_MDE,
                title: "Contact Mode Preference",
                content: content.LST_CONT_PREF_MDE,
            },
            {
                show: !!content.LST_CONT_PREF_TIME_SLOT,
                title: "Contact Time Preference",
                content: content.LST_CONT_PREF_TIME_SLOT == 4 ? content.LST_CONT_PREF_DTL : preferTimeList.find(item => item.value == content.LST_CONT_PREF_TIME_SLOT)?.label,
            },
            {
                show: !!content.REPT_ASGN_RMKS_IND,
                title: 'Remark For Previous Round Ind.',
                content: content.REPT_ASGN_RMKS_IND,
            }

        ]

        if(!content.Chinese_Full_Mail_Address){
            content.Chinese_Full_Mail_Address = [content.MAIL_ADDR_CHI_1, content.MAIL_ADDR_CHI_2, content.MAIL_ADDR_CHI_3, content.MAIL_ADDR_CHI_4, content.MAIL_ADDR_CHI_5, content.MAIL_ADDR_CHI_6].filter(add => add && add != '').join(', ');
        }
        const onClickQC = (assignment) => {

            setQcContent({
                isOpen: true,
                assignmentList: [{
                    SC_UID: assignment.SRVY_CYCLE_UID,
                    ASGN_UID: assignment.ASGN_UID,
                    ASGN_GUID: assignment.GUID,
                    ASGN_REF_NO: assignment.ASGN_REF_NO,
                    Q_DATA_VER_NO: assignment.LAT_Q_DATA_VER_NO,
                }],
            });
        };

        const applyPhoneMask = (tel, ext, refNo) => {
            const phone = [tel, ext].filter(i => i).join("-");

            // return (
            //     phone && <Tooltip label={phone}>
            //         {`${phone.substring(0, 4)}${phone.length > 4 ? Array(phone.length - 4).fill('*').join('') : ''}`}
            //         {/* <span className='tooltiptext'>{phone}</span> */}
            //     </Tooltip>
            // )

            const displayTel = tel ? tel.slice(0, 4) + ' ' + tel.slice(4) : ''

            return (
                phone && <div key={refNo + "_" + phone} className="tel_wrapper" >
                    <Popover closeOnBlur trigger="hover">
                        <PopoverTrigger>
                            <span className="encrpyted">
                                {`${phone.substring(0, 4)}${phone.length > 4 ? Array(phone.length - 4).fill('*').join('') : ''}`}
                            </span>
                        </PopoverTrigger>
                        <PopoverContent>
                            <PopoverBody>
                                <div className="tel_details">
                                    <span>{displayTel}</span>{ext && ext !== '' ? <span className="ext">- {ext}</span> : null}
                                </div>
                            </PopoverBody>
                        </PopoverContent>
                    </Popover>
                </div>
            );

            // return (
            //     phone != '' ?
            //         <Tooltip label={phone}>
            //             {`${phone.substring(0, 4)}${phone.length > 4 ? Array(phone.length - 4).fill('*').join('') : ''}`}
            //             {/* <span className='tooltiptext'>{phone}</span> */}
            //         </Tooltip>
            //         : null
            // )
        }

        const generatePhoneNumber = (content) => {
            const arr = [applyPhoneMask(content.LST_CONT_TEL_1, content.LST_CONT_TEL_EXT_1, content.ASGN_REF_NO), applyPhoneMask(content.LST_CONT_TEL_2, content.LST_CONT_TEL_EXT_2, content.ASGN_REF_NO)].filter(i => i)
            if (arr.length == 0) return <div key={content.ASGN_REF_NO + "_NOTEL"} >-</div>
            if (arr.length == 1) return <div key={content.ASGN_REF_NO + "_" + content.LST_CONT_TEL_1} >{arr[0]}</div>
            if (arr.length == 2) return [arr[0], <div key={content.ASGN_REF_NO + "_TEMP"}>/</div>, arr[1]]
        }

        /***************************************************************************************************************************************************************
         *                                                                         Mantis 8706                                                                         *
         ***************************************************************************************************************************************************************/
        // const handleQuickView = (guid) => {
        // };
        //***************************************************************************************************************************************************************

        return (
            // TODO add assignment status class (.add, .remove, .done) for assignmentItem
            <div key={content.ASGN_REF_NO + index} className={`assignmentItem ${content.ItineraryPlanObject?.filter(item => item.IPLN_STS == 'D').length > 0 ? 'remove' : 'add'}`}>
                <div className='fieldRowContainer left'>
                    <Tooltip label={content.ItineraryPlanObject?.filter(item => item.IPLN_STS == 'D').length > 0 ? 'Remove from itinerary plan' : 'Add to itinerary plan'}>
                        <div className="actionIcon" onClick={() => onClickAddToItineraryPlanBySingle(content)}></div>
                    </Tooltip>
                    <Accordion allowToggle className='detailsPreviewWrapper'>
                        <AccordionItem>
                            <div className="heading" >
                                <div className='fieldRowContainer'>
                                {/* TODO: offline group icon */}
                                    {content?.GRP_NAME ? <div className='fieldContainer'>
                                        <span style={{ textDecoration: 'underline', cursor: 'pointer' }}
                                            onClick={() => handleUpdateGroupName(content)}>{content.GRP_NAME}</span>
                                        <div className="icon_delete_2" onClick={() => {
                                            handleDeleteGroup(content, tableContent)
                                        }}></div>
                                    </div> : ''}
                                    <div className='fieldContainer'>{content.SRVY_CD}</div>
                                    <div className='fieldContainer'>{content.SRVY_CYCLE_CODE}</div>
                                    <div className='fieldContainer'>{content.ASGN_REF_NO}</div>
                                    <div className="fieldContainer">
                                        <span className="addr_chi" onClick={() => {
                                            window.dispatchEvent(new Event('resize')); //for tablet handling
                                            setSelectedLoc(content)
                                            if (content['X_Coor'] != null && content['Y_Coor'] != null) {
                                                setCurrentPosition([content['X_Coor'], content['Y_Coor']])
                                            }
                                            //setZoomScale(DEFAULT_ZOOM_SCALE);
                                            setZoomScale(20);
                                        }}>{content.Chinese_Full_Mail_Address}</span>
                                    </div>
                                    <AccordionButton>
                                        <AccordionIcon className="accordionBtn" />
                                    </AccordionButton>
                                </div>

                                <AccordionPanel>
                                    <div className="miscfull">
                                        <div className='fieldRowContainer addrBtn'>
                                            <div className="fieldContainer">
                                                <div className="addr_chi" onClick={() => {
                                                    window.dispatchEvent(new Event('resize')); //for tablet handling
                                                    setSelectedLoc(content)
                                                    if (content['X_Coor'] != null && content['Y_Coor'] != null) {
                                                        setCurrentPosition([content['X_Coor'], content['Y_Coor']])
                                                    }
                                                    //setZoomScale(DEFAULT_ZOOM_SCALE);
                                                    setZoomScale(20);
                                                }}>
                                                    <div className="address">
                                                        {content.MAIL_ADDR_ENG_1 + (content.MAIL_ADDR_ENG_2 != '' ? ", " + content.MAIL_ADDR_ENG_2 : '')}
                                                        {(content.MAIL_ADDR_ENG_3 != '' ? <>,  <span className="highlighted">{content.MAIL_ADDR_ENG_3} </span></> : '')}
                                                        {(content.MAIL_ADDR_ENG_4 != '' ? ", " + content.MAIL_ADDR_ENG_4 : '') + (content.MAIL_ADDR_ENG_5 != '' ? ", " + content.MAIL_ADDR_ENG_5 : '') + (content.MAIL_ADDR_ENG_6 != '' ? ", " + content.MAIL_ADDR_ENG_6 : '') /*+ ", " + content.DCCA_ENG*/}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div className='fieldRowContainer'>

                                            {/* <div className='fieldContainer'>{content.SRVY_NAME_ENG}</div> */}
                                            <div className='fieldContainer'><label>Appt. (Mode/Date):</label>{interviewModeList.find(item => item.value == content.LST_APPT_INTV_MDE)?.value ?? '-'}/{content.LST_APPT_DT_NEW ? moment(content.LST_APPT_DT_NEW).format('y-MM-DD') : '-'}</div>
                                            <div className='fieldContainer'>
                                                <label>Tel.:</label>{generatePhoneNumber(content)}
                                                {/* {contactList.find(item => content.ContactObject[0]?.GUID == item.GUID)?.TEL_1} /
                            {contactList.find(item => content.ContactObject[0]?.GUID == item.GUID)?.TEL_2} */}
                                            </div>
                                        </div>
                                    </div>
                                </AccordionPanel>
                            </div>
                        </AccordionItem>
                    </Accordion>
                    <Container variant="outlinePurple" className='detailsPreviewWrapper' style={{ transition: 'height 2s', width: 'calc(100% - 40px)', height: expandPool.some(item => item == content['GUID']) ? 'fit-content' : '44px', overflow: expandPool.some(item => item == content['GUID']) ? 'visible' : 'hidden' }}>
                        <div className='innerWrapper'>

                            {
                                vaContent.length > 0 && <div className='fieldContainer vaiconList'>
                                    {
                                        vaContent?.map((vaicon) => (
                                            <Tooltip key={content.ASGN_REF_NO + "_" + vaicon.value} label={vaicon.tooltip} >
                                                <div className={`tooltip icon_va_${vaicon.value}`} ></div>
                                            </Tooltip>
                                        ))
                                    }
                                </div>
                            }
                            {
                                fieldList.filter(item => !item.hide).map(item => <div key={"sub_" + content.ASGN_REF_NO + item.title + "_" + item.content} className='fieldContainer'><label>{item.title}</label>{item.title ? ':' : ''}{item.show ? item.content : '-'}</div>)
                            }
                        </div>
                        <IconButton variant="plain" icon={expandPool.some(item => item == content['GUID']) ? <ChevronUpIcon /> : <ChevronDownIcon />} className='externalButton' onClick={() => onClickExpand(content)} />
                    </Container>
                </div>
                <div className='fieldRowContainer right'>
                    <div className="fieldContainer">
                        <div className="btnContainer">
                            {
                                content.SHK_MAP_IND == 'Y' && <Button onClick={() => { onClickSketchMap(content, content.EFieldCardObject?.length > 0 ? content.EFieldCardObject[0].GUID : null) }}>Sketch Map</Button>
                            }
                            {
                                content.SEG_MAP_IND == 'Y' && <Button onClick={() => onClickSegmentMap(content)}>Segment Map</Button>
                            }
                            <div className="btnWrapper">
                                <div className="iconsWrapper">
                                    <Tooltip label="Assignment Details">
                                        <div className="icon_assignmentDetails" onClick={() => navigate(`/main/assignment/${content[object_key]}`)}></div>
                                    </Tooltip>
                                    <Tooltip label='Efield Card' >
                                        <div className="icon_efieldCard" onClick={() => navigate(`/main/eField/${content['GUID']}`)}></div>
                                    </Tooltip>
                                    </div>
                                    
                                    <Tooltip label="Select assignment">
                                        <div className='checker_wrapper'>
                                            <Checkbox
                                                className='checkBox'
                                                isChecked={checkedPool.some(item => item[object_key] == content[object_key])}
                                                onChange={() => onClickCheckBox(content)}
                                            />
                                        </div>
                                    </Tooltip>
                                </div>
                                {/** Mantis 8706 New Assignment Buttons */}
                                <div className="secondRowButtons">
                                    <button 
                                        className="preview-questionnaire-btn"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setSelectedAssignmentGuid(content.GUID);
                                            setIsQuickViewOpen(true)
                                        }}
                                    >
                                        Quick Preview
                                    </button>
                                    {/** currently same as preview */}
                                    {/*
                                    <button 
                                        className="view-prefilled-btn"
                                        disabled={!content.TEMP_DOC_REF_NO}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setSelectedAssignmentGuid(content.GUID);
                                            setIsQuickViewOpen(true);
                                        }}
                                    >
                                        P
                                    </button>
                                    */}
                                </div>
                            </div>
                                                            

                    </div>
                </div>
            </div >
        )
    }


    useEffect(() => { submitFilterForm(filterFormContent, tableContent, contactList) }, [tableContent])

    const submitFilterForm = (filterForm, contentList = [], contactList) => {
        // const parsedFilterForm = {}
        // Object.entries(filterForm).forEach(([key, value]) => {
        //     if (filterForm[key] == null || filterForm[key] == '' || key == 'searchText') return
        //     parsedFilterForm[key] = value
        // })

        // if (assignRefList.length < 1 && !parsedFilterForm.ASGN_STS) {
        //     setAlertContent({
        //         isOpen: true,
        //         title: 'Warning',
        //         msg: 'Please select at least one assignment status to search',
        //         onClose: () => {
        //             setAlertContent({
        //                 isOpen: false,
        //                 msg: '',
        //                 onClose: null
        //             })
        //         }
        //     });
        //     return;
        // }

        let filterResult = contentList;

        // Offline filtering
        if (!(process.env.IS_ONLINE == 'true' && localStorage.getItem('IS_ONLINE') == 'true')) {
            const parsedFilterForm = {}
            Object.entries(filterForm).forEach(([key, value]) => {
                if (filterForm[key] == null || filterForm[key] == '' || key == 'searchText') return
                parsedFilterForm[key] = value
            })
            console.log('DEBUG - offline filter form', parsedFilterForm)

            filterResult = filterResult?.filter(content =>
            (
                !Object.entries(parsedFilterForm).some(([key, value]) => {
                    switch (key) {
                        case 'pAddress': {
                            return !value.some(element =>
                                content.ASGN_REF_NO?.toLowerCase()?.includes(element.toString()?.toLowerCase()) ||
                                content.MAIL_ADDR_ENG_1?.toLowerCase()?.includes(element?.toString()?.toLowerCase()) ||
                                content.MAIL_ADDR_ENG_2?.toLowerCase()?.includes(element?.toString()?.toLowerCase()) ||
                                content.MAIL_ADDR_ENG_3?.toLowerCase()?.includes(element?.toString()?.toLowerCase()) ||
                                content.MAIL_ADDR_ENG_4?.toLowerCase()?.includes(element?.toString()?.toLowerCase()) ||
                                content.MAIL_ADDR_ENG_5?.toLowerCase()?.includes(element?.toString()?.toLowerCase()) ||
                                content.MAIL_ADDR_ENG_6?.toLowerCase()?.includes(element?.toString()?.toLowerCase()) ||
                                content.MAIL_ADDR_CHI_1?.toLowerCase()?.includes(element?.toString()?.toLowerCase()) ||
                                content.MAIL_ADDR_CHI_2?.toLowerCase()?.includes(element?.toString()?.toLowerCase()) ||
                                content.MAIL_ADDR_CHI_3?.toLowerCase()?.includes(element?.toString()?.toLowerCase()) ||
                                content.MAIL_ADDR_CHI_4?.toLowerCase()?.includes(element?.toString()?.toLowerCase()) ||
                                content.MAIL_ADDR_CHI_5?.toLowerCase()?.includes(element?.toString()?.toLowerCase()) ||
                                content.ADDR_ENG_1?.toLowerCase()?.includes(element?.toString()?.toLowerCase()) ||
                                content.ADDR_ENG_2?.toLowerCase()?.includes(element?.toString()?.toLowerCase()) ||
                                content.ADDR_ENG_3?.toLowerCase()?.includes(element?.toString()?.toLowerCase()) ||
                                content.ADDR_ENG_4?.toLowerCase()?.includes(element?.toString()?.toLowerCase()) ||
                                content.ADDR_ENG_5?.toLowerCase()?.includes(element?.toString()?.toLowerCase()) ||
                                content.ADDR_CHI_1?.toLowerCase()?.includes(element?.toString()?.toLowerCase()) ||
                                content.ADDR_CHI_2?.toLowerCase()?.includes(element?.toString()?.toLowerCase()) ||
                                content.ADDR_CHI_3?.toLowerCase()?.includes(element?.toString()?.toLowerCase()) ||
                                content.ADDR_CHI_4?.toLowerCase()?.includes(element?.toString()?.toLowerCase()) ||
                                content.ADDR_CHI_5?.toLowerCase()?.includes(element?.toString()?.toLowerCase())
                            )
                        }
                        case 'TPU':
                        case 'SB': {
                            return content.AssignmentDetailObject[0][key] != value
                        }
                        case 'pFuQcInd': {
                            return value == 'Y' && content.FU_QC_IND_YN != value
                        }
                        case 'TEL': {
                            // should not be contactList, should be contentList(when user report bug just fix this, just from my logic no tested)
                            // like this 'const contactDetail = contentList?.filter'
                            const contactDetail = contactList?.filter(item => value == '' || item.TEL_1?.includes(value) || item.TEL_2?.includes(value)) ?? []
                            return !contactDetail.some(item => item.ASGN_UID == content.ASGN_UID)
                        }
                        case 'ENUM_RSLT_CD':
                        case 'RFSL_IND':
                        case 'OQ_ACCT_IND':
                        case 'SRVY_CYCLE_UID':
                        case 'LST_APPT_INTV_MDE':
                        case 'BKM':
                        case 'PAIR_VST_IND':
                        case 'POOL_OU_UID':
                        case 'RESP_STF_UID':
                        case 'TEAM_OU_UID': {
                            return value != content[key]
                        }
                        case 'SRVY_UID': {
                            return value != ' ' && value != content[key]
                        }
                        case 'ASGN_STS': {
                            return !value.some(item => item == content[key])
                        }
                        case 'LST_APPT_DT_NEW': {
                            return !(content[key] && moment(content[key]).isSame(moment(value), 'date'))
                        }
                        case 'ASGN_PRTY': {
                            return content[key] < value[0] || content[key] > value[1]
                        }
                        case 'RemarkList': {
                            return (!content.AssignmentDetailObject[0][key]?.length) == (value == 'Y')
                        }
                        case 'REPT_ASGN_UID':
                        case 'SEG_KEY': {
                            return (!content[key]) == (value == 'Y')
                        }
                        case 'SDU': {
                            return (!content.AssignmentDetailObject[0][key]) == (value == 'Y')
                        }
                        case 'REPT_ASGN_RMKS_IND':
                        case 'NFA_IND':
                        case 'NFV_IND':
                        case 'FLD_OS_IND': {
                            return content[key] != 'Y'
                        }
                        case 'pReallocInd': {
                            return content.REALLOC_IND != 'Y'
                        }
                        case 'HLD_STS': {
                            return content[key] != 'H'
                        }
                        case 'pBldgCsuId': {
                            return !!value && content.BLDG_CSUID_LST != value
                        }
                        case 'totalOp': {
                            const op = (value == '=' ? '==' : value)
                            if (!parsedFilterForm.totalNum && parsedFilterForm.totalNum != 0 && !content.InterviewLogListObject) return false
                            const counter = content.NCD_SUM + content.NCN_SUM
                            return !eval(`${counter}${op}${parsedFilterForm.totalNum}`)
                        }
                        case 'dayOp': {
                            const op = (value == '=' ? '==' : value)
                            if (!parsedFilterForm.dayNum && parsedFilterForm.dayNum != 0 && !content.InterviewLogListObject) return false
                            const counter = content.NCD_SUM
                            return !eval(`${counter}${op}${parsedFilterForm.dayNum}`)
                        }
                        case 'nightOp': {
                            const op = (value == '=' ? '==' : value)
                            if (!parsedFilterForm.nightNum && parsedFilterForm.nightNum != 0 && !content.InterviewLogListObject) return false
                            const counter = content.NCN_SUM
                            return !eval(`${counter}${op}${parsedFilterForm.nightNum}`)
                        }
                        case 'totalNum':
                        case 'dayNum':
                        case 'nightNum': {
                            return false
                        }
                        case 'GRP_NAME':
                            const contactDetail = contentList?.filter(item => value == '' || item.GRP_NAME?.includes(value)) ?? []
                            return !contactDetail.some(item => item.ASGN_UID == content.ASGN_UID)
                        default: {
                            // DO NOTHING
                        }
                    }
                })
            ))
            console.log('DEBUG - offline filtered content', filterResult)
        }
        
        
        if(localStorage.getItem('IS_ONLINE') == 'false' && filterResult.length > 1 && sortType.length > 0){
                try{             
                                //const sort_order = filterForm.sorting_order != null && filterForm.sorting_order != [] ? filterForm.sorting_order : 'asc';
                                // sort
                                let sortedSeqObj = filterResult?.sort((a, b) => {
                                    for (let sortTypeRaw of sortType.map(i=>i.value)) {
                                        const [sort_type , sort_order] = sortTypeRaw.split('-')
                                        let aValue = a && a[sort_type] !== undefined ? a[sort_type] : null;
                                        let bValue = b && b[sort_type] !== undefined ? b[sort_type] : null;
                
                                        // get sortField type for SortingList
                                        let sortFieldType = AssignmentSortingList.find(item => item.value === sort_type).type;
                
                                        if (aValue === null && bValue === null) continue
                                        if (aValue === null) return sort_order=== 'ASC' ? -1 : 1
                                        if (bValue === null) return sort_order=== 'ASC' ? 1 : -1
                
                                        if (sortFieldType === 'NUM') {
                                            aValue = Number(aValue);
                                            bValue = Number(bValue);
                                            if (aValue < bValue) return sort_order === 'ASC' ? -1 : 1
                                            if (aValue > bValue) return sort_order === 'ASC' ? 1 : -1
                
                                        }else if(sortFieldType === 'STR') {
                                            aValue = aValue.toLowerCase()
                                            bValue = bValue.toLowerCase()
                                            let result = aValue.localeCompare(bValue)
                                            return sort_order === 'ASC' ? result : -result;
                
                                        }else if (sortFieldType === 'DT') {
                                            aValue = new Date(aValue)
                                            bValue = new Date(bValue)
                
                                            console.log('DT 999', aValue, bValue);
                
                                            if (aValue < bValue) return sort_order === 'ASC' ? -1 : 1
                                            if (aValue > bValue) return sort_order === 'ASC' ? 1 : -1
                                        }
                
                                    }
                                    return 0;
                                });
         
                                //set 
                                console.log('DEBUG2 - offline sorted content', sortedSeqObj)
                                setTableContent(sortedSeqObj);
                            }catch(e){
                                console.log("error:",e);
                            }
        }
        
        // if(tableContent && tableContent.length >0){
        //     filterList = tableContent
        // }
        // const filterResult = filterList.filter(content => 
        //     (
        //     !Object.entries(parsedFilterForm).some(([key, value]) => {
        //         switch (key) {
        //             case 'pAddress': {
        //                 return !value.some(element =>
        //                     content.English_Full_Mail_Address?.toLowerCase()?.includes(element?.toString()?.toLowerCase()) ||
        //                     content.ASGN_REF_NO?.toLowerCase()?.includes(element.toString()?.toLowerCase()) ||
        //                     content.Chinese_Full_Mail_Address?.toString()?.toLowerCase()?.includes(element?.toString()?.toLowerCase())
        //                 )
        //             }
        //             case 'TPU':
        //             case 'SB': {
        //                 return content.AssignmentDetailObject[0][key] != value
        //             }
        //             // case 'pFuQcInd': {
        //             //     return content[key] != 'N'
        //             // }
        //             case 'TEL': {
        //                 const contactDetail = contactList?.filter(item => item.TEL_1 == value || item.TEL_2 == value) ?? []
        //                 return !contactDetail.some(item => item.ASGN_UID == content.ASGN_UID)
        //             }
        //             case 'ASGN_STS': {
        //                 return !value.some(item => item == content[key])
        //             }
        //             case 'LST_APPT_DT_NEW': {
        //                 return !(content[key] && moment(content[key]).isSame(moment(value), 'date'))
        //             }
        //             case 'ASGN_PRTY': {
        //                 return content[key] < value[0] || content[key] > value[1]
        //             }
        //             case 'RemarkList': {
        //                 return (!content.AssignmentDetailObject[0][key]?.length) == (value == 'Y')
        //             }
        //             case 'REPT_ASGN_UID':
        //             case 'SEG_KEY': {
        //                 return (!content[key]) == (value == 'Y')
        //             }
        //             case 'SDU': {
        //                 return (!content.AssignmentDetailObject[0][key]) == (value == 'Y')
        //             }
        //             case 'REPT_ASGN_RMKS_IND':
        //             case 'NFA_IND':
        //             case 'NFV_IND': {
        //                 return content[key] != 'Y'
        //             }
        //             case 'FLD_OS_IND': {
        //                 return !!value && content[key] != 'Y'
        //             }
        //             case 'HLD_STS': {
        //                 return content[key] != 'H'
        //             }
        //             case 'totalOp': {
        //                 const op = value == '=' ? '==' : value
        //                 if (!parsedFilterForm.totalNum && parsedFilterForm.totalNum != 0 && !content.InterviewLogListObject) return false
        //                 const counter = content.NCD_SUM + content.NCN_SUM
        //                 return !eval(`${counter}${op}${parsedFilterForm.totalNum}`)
        //             }
        //             case 'dayOp': {
        //                 const op = value == '=' ? '==' : value
        //                 if (!parsedFilterForm.dayNum && parsedFilterForm.dayNum != 0 && !content.InterviewLogListObject) return false
        //                 const counter = content.NCD_SUM
        //                 return !eval(`${counter}${op}${parsedFilterForm.dayNum}`)
        //             }
        //             case 'nightOp': {
        //                 const op = value == '=' ? '==' : value
        //                 if (!parsedFilterForm.nightNum && parsedFilterForm.nightNum != 0 && !content.InterviewLogListObject) return false
        //                 const counter = content.NCN_SUM
        //                 return !eval(`${counter}${op}${parsedFilterForm.nightNum}`)
        //             }
        //             case 'totalNum':
        //             case 'dayNum':
        //             case 'nightNum': {
        //                 return false
        //             }
        //             default: {
        //                 // return content[key] == value
        //             }
        //         }
        //     })
        // ))

        const outstandingCount = filterResult.filter(item => item.FLD_OS_IND == "Y").length
        const holdCount = filterResult.filter(item => item.HLD_STS == "Y").length

        setHeaderContent({
            totalHold: holdCount,
            totalOutstanding: outstandingCount,
        })
        setZoomScale(null)

        // setTableContent(isOnline ? contentList : filterResult.filter((item, index) => index >= (formContent.pageSize * (formContent.page - 1)) && index < (formContent.pageSize * (formContent.page))))
        setDisplayAssignMapData(filterResult)
        return filterResult
        // setCheckedPool([]);
    }

    const addAssignmentToItineraryPlan = async (selectedAssignment) => {
        setIsLoading(true);
        const tempCheckedPool = selectedAssignment ? [selectedAssignment] : checkedPool;
        const tempCheckedPoolDetailGUID = [...Array(tempCheckedPool.length)].map(item => uuid());
        const tempCheckedPoolSeqGUID = [...Array(tempCheckedPool.length)].map(item => uuid());

        const fechItinData = async () => {
            if (process.env.IS_ONLINE == 'true' && localStorage.getItem('IS_ONLINE') == 'true') {
                const result = await dispatch(getItineraryPlan(
                    {
                        filter: {
                            pStartDate: moment(addToItinPlanContent.IPLN_DT).set({
                                hour: '00',
                                minute: '00',
                                second: '00',
                                millisecond: '00'
                            }).toISOString(true),
                            pEndDate: moment(addToItinPlanContent.IPLN_DT).set({
                                hour: '23',
                                minute: '55',
                                second: '55',
                                millisecond: '00'
                            }).toISOString(true)
                        },
                        pStaffUid: user.id,
                        PageNumber: 1,
                        PageSize: -1,
                    }
                )).then(action => {
                    if (action?.payload?.status == '200' && action.payload.data.ErrCode != 1) {
                        return action.payload.data.itineraryPlanList.filter(itin => moment(itin.IPLN_DT).format('YYYY-MM-DD') == moment(addToItinPlanContent.IPLN_DT).format('YYYY-MM-DD') && itin.IS_SHOW);
                    } else {
                        const result = getAllData('DCP', 'itineraryPlan').then(data => {
                            return data.filter(itin => moment(itin.IPLN_DT).format('YYYY-MM-DD') == moment(addToItinPlanContent.IPLN_DT).format('YYYY-MM-DD') && itin.IS_SHOW);
                        })
                        return result
                    }
                })
                return result
            } else {
                const result = getAllData('DCP', 'itineraryPlan').then(data => {
                    return data.filter(itin => moment(itin.IPLN_DT).format('YYYY-MM-DD') == moment(addToItinPlanContent.IPLN_DT).format('YYYY-MM-DD') && itin.IS_SHOW);
                })
                return result
            }
        }
        const itinPlanList = await fechItinData();
        const targetItinPlan = itinPlanList.find(itin => itin.IPLN_STS == 'D');
        //Check any pending/approved record on that date
        if (itinPlanList.some(itin => itin.IPLN_STS == 'P' || itin.IPLN_STS == 'A')) {
            setAlertContent({
                isOpen: true,
                title: 'Warning',
                msg: 'The selected itinerary plan is pending for approval/approved. Please select another date.',
                onClose: () => {
                    setAlertContent({
                        isOpen: false,
                        msg: '',
                        onClose: null
                    })
                }
            });
            setIsLoading(false);
            return;
        }

        //Check any duplicate assignment
        const duplicateAssignment = tempCheckedPool.filter(dupAssign => targetItinPlan?.ItineraryPlanSeqObject.some(seq => seq.ASGN_GUID == dupAssign.GUID));
        if (duplicateAssignment?.length > 0) {
            setAlertContent({
                isOpen: true,
                title: 'Warning',
                msg: `The following assignment are already exist on draft of selected date: ${duplicateAssignment.map(dupAssign => dupAssign.ASGN_REF_NO).join(', ')}`,
                onClose: () => {
                    setAlertContent({
                        isOpen: false,
                        msg: '',
                        onClose: null
                    })
                }
            });
            setIsLoading(false);
            return;
        }
        

        ///gropping here
        const groppingResult = tempCheckedPool.reduce(
            (acc, item) => {
              const { ASGN_GRP_GUID } = item;
              if (!ASGN_GRP_GUID) {
                acc.singleItems.push(item); // Add item to the separate nullGroup array
              } else {
                if (!acc.groppedItems[ASGN_GRP_GUID]) {
                  acc.groppedItems[ASGN_GRP_GUID] = []; // Initialize the group array if it doesn't exist
                }
                acc.groppedItems[ASGN_GRP_GUID].push(item); // Add item to the corresponding group
              }
              return acc;
            },
            { groppedItems: {}, singleItems: [] }
          );
          const {groppedItems, singleItems} = groppingResult


        const newItinPlanGUID = uuid();
        let newDetailObject = [];
        let newSeqObject = [];
        let newGroupObject = [];

        if (!targetItinPlan) {
            let seq_no = 1; 
            singleItems?.map((assign, index) => {
                newDetailObject.push({
                    ASGN_GUID: assign.GUID,
                    ASGN_UID: assign.ASGN_UID,
                    // DEST: assign.English_Full_Address,
                    DEST_LAT: assign.X_Coor,
                    DEST_LONG: assign.Y_Coor,
                    GRP_SEQ_NO: 0,
                    GUID: tempCheckedPoolDetailGUID[index],
                    IPLN_GRP_GUID: null,
                    IPLN_GRP_UID: null,
                    IPLN_ITM_UID: null,
                    PLN_DT: null,
                    //PLN_DT: moment().toISOString(true),
                    TPU: null
                })
            })

            singleItems?.map((assign, index) => {
                newSeqObject.push({
                    ASGN_GUID: assign.GUID,
                    ASGN_UID: assign.ASGN_UID,
                    GRP_SEQ_NO: 0,
                    GUID: tempCheckedPoolSeqGUID[index],
                    IPLN_GRP_GUID: null,
                    IPLN_GRP_UID: null,
                    IPLN_GUID: newItinPlanGUID,
                    IPLN_ITM_GUID: tempCheckedPoolDetailGUID[index],
                    IPLN_ITM_UID: null,
                    IPLN_SEQ_UID: null,
                    IPLN_UID: null,
                    SEQ_NO: seq_no,
                    SEQ_TYP: "I"
                })
                seq_no ++;
            })


            let groupnewGroupObject = [];
            let groupnewDetailObject = []
            let groupnewSeqObject = []

            const groupedItemsArray = Object.values(groppedItems); // Get grouped values as an array
            for (let groupIndex = 0; groupIndex < groupedItemsArray.length; groupIndex++) {
              const group = groupedItemsArray[groupIndex];
              const groupUuid = uuid();
              
              groupnewGroupObject.push({
                IPLN_GRP_UID: null,
                GUID: groupUuid,
                IPLN_UID: null,
                IPLN_GUID: newItinPlanGUID,
                PLN_DT: null,
                GRP_NAME: group[0].GRP_NAME
              });
            
              // Start seq_no outside the inner loop to persist its increment within this group
            
              for (let itemIndex = 0; itemIndex < group.length; itemIndex++) {
                const item = group[itemIndex];
                const IPLN_ITM_GUID = uuid();
            
                groupnewDetailObject.push({
                  ASGN_GUID: item.GUID,
                  ASGN_UID: item.ASGN_UID,
                  DEST_LAT: item.X_Coor,
                  DEST_LONG: item.Y_Coor,
                  GRP_SEQ_NO: itemIndex,
                  GUID: IPLN_ITM_GUID,
                  IPLN_GRP_GUID: groupUuid,
                  IPLN_GRP_UID: null,
                  IPLN_ITM_UID: null,
                  PLN_DT: null,
                  TPU: null
                });
            
                if(itemIndex === 0){
                    groupnewSeqObject.push({
                  ASGN_GUID: item.GUID,
                  ASGN_UID: item.ASGN_UID,
                  GRP_SEQ_NO: 0,
                  GUID: uuid(),
                  IPLN_GRP_GUID: groupUuid,
                  IPLN_GRP_UID: null,
                  IPLN_GUID: newItinPlanGUID,
                  IPLN_ITM_GUID: IPLN_ITM_GUID,
                  IPLN_ITM_UID: null,
                  IPLN_SEQ_UID: null,
                  IPLN_UID: null,
                  SEQ_NO: seq_no,
                  SEQ_TYP: "G" 
                });
                seq_no++;

                }

              }
            }            

              newGroupObject = [...newGroupObject,...groupnewGroupObject]
              newDetailObject = [...newDetailObject,...groupnewDetailObject] 
              newSeqObject =  [...newSeqObject,...groupnewSeqObject]

            let newItinPlan = {
                GUID: newItinPlanGUID,
                STF_UID: user.id,
                IPLN_DT: null, /*addToItinPlanContent.IPLN_DT,*/
                IPLN_STS: 'D',
                RMKS: '',
                SEL_APRV_STF_UID: addToItinPlanContent.SEL_APRV_STF_UID,
                ItineraryPlanGroupObject: newGroupObject,
                ItineraryPlanDetailsObject: newDetailObject,
                ItineraryPlanSeqObject: newSeqObject,
            }
            //Handle Index Db
            await addData('DCP', 'itineraryPlan', [newItinPlan], 'GUID', false).then(() => {
                dispatch(triggerFetch());
            })
            setAlertContent({
                isOpen: true,
                onClose: () => {
                    setAlertContent({ isOpen: false })
                    setCheckedPool([])
                    dispatch(triggerFetch());
                },
                title: 'Notice',
                msg: 'Assignment is added into the itinerary plan successfully'
            })
        } else {
            let maxSeqNo = targetItinPlan.ItineraryPlanSeqObject.length > 0 ? Math.max(...targetItinPlan.ItineraryPlanSeqObject?.map(o => o.SEQ_NO)) + 1 : 999;
            singleItems?.map((assign, index) => {
                newDetailObject.push({
                    ASGN_GUID: assign.GUID,
                    ASGN_UID: assign.ASGN_UID,
                    // DEST: assign.English_Full_Address,
                    DEST_LAT: assign.X_Coor,
                    DEST_LONG: assign.Y_Coor,
                    GRP_SEQ_NO: 0,
                    GUID: tempCheckedPoolDetailGUID[index],
                    IPLN_GRP_GUID: null,
                    IPLN_GRP_UID: null,
                    IPLN_ITM_UID: null,
                    PLN_DT: null,//moment().toISOString(true),
                    TPU: null
                })
                maxSeqNo++;
                newSeqObject.push({
                    ASGN_GUID: assign.GUID,
                    ASGN_UID: assign.ASGN_UID,
                    GRP_SEQ_NO: 0,
                    GUID: tempCheckedPoolSeqGUID[index],
                    IPLN_GRP_GUID: null,
                    IPLN_GRP_UID: null,
                    IPLN_GUID: newItinPlanGUID,
                    IPLN_ITM_GUID: tempCheckedPoolDetailGUID[index],
                    IPLN_ITM_UID: null,
                    IPLN_SEQ_UID: null,
                    IPLN_UID: null,
                    SEQ_NO: maxSeqNo,
                    SEQ_TYP: "I"
                })
                targetItinPlan.ItineraryPlanDetailsObject = [...targetItinPlan.ItineraryPlanDetailsObject, ...newDetailObject];
                targetItinPlan.ItineraryPlanSeqObject = [...targetItinPlan.ItineraryPlanSeqObject, ...newSeqObject];
                targetItinPlan.ItineraryPlanGroupObject = [...targetItinPlan.ItineraryPlanGroupObject, ...newGroupObject];
            })


            let groupnewGroupObject = [];
            let groupnewDetailObject = []
            let groupnewSeqObject = []

            const groupedItemsArray = Object.values(groppedItems); // Get grouped values as an array
            if(targetItinPlan.ItineraryPlanSeqObject && targetItinPlan.ItineraryPlanSeqObject.length > 0){
                for(let i of targetItinPlan.ItineraryPlanSeqObject){
                    if(i.SEQ_NO && i.SEQ_NO+1 > maxSeqNo){
                        maxSeqNo = i.SEQ_NO+1;
                    }
                }
            }
            for (let groupIndex = 0; groupIndex < groupedItemsArray.length; groupIndex++) {
              const group = groupedItemsArray[groupIndex];
              const groupUuid = uuid();
              
              groupnewGroupObject.push({
                IPLN_GRP_UID: null,
                GUID: groupUuid,
                IPLN_UID: null,
                IPLN_GUID: newItinPlanGUID,
                PLN_DT: null,
                GRP_NAME: group[0].GRP_NAME
              });
            
              // Start seq_no outside the inner loop to persist its increment within this group
            
              for (let itemIndex = 0; itemIndex < group.length; itemIndex++) {
                const item = group[itemIndex];
                const IPLN_ITM_GUID = uuid();
            
                groupnewDetailObject.push({
                  ASGN_GUID: item.GUID,
                  ASGN_UID: item.ASGN_UID,
                  DEST_LAT: item.X_Coor,
                  DEST_LONG: item.Y_Coor,
                  GRP_SEQ_NO: itemIndex,
                  GUID: IPLN_ITM_GUID,
                  IPLN_GRP_GUID: groupUuid,
                  IPLN_GRP_UID: null,
                  IPLN_ITM_UID: null,
                  PLN_DT: null,
                  TPU: null
                });
            
                if(itemIndex === 0){
                    groupnewSeqObject.push({
                  ASGN_GUID: item.GUID,
                  ASGN_UID: item.ASGN_UID,
                  GRP_SEQ_NO: 0,
                  GUID: uuid(),
                  IPLN_GRP_GUID: groupUuid,
                  IPLN_GRP_UID: null,
                  IPLN_GUID: newItinPlanGUID,
                  IPLN_ITM_GUID: IPLN_ITM_GUID,
                  IPLN_ITM_UID: null,
                  IPLN_SEQ_UID: null,
                  IPLN_UID: null,
                  SEQ_NO: maxSeqNo,
                  SEQ_TYP: "G" 
                });
                maxSeqNo++;

                }

              }
            }            

              targetItinPlan.ItineraryPlanDetailsObject = [...targetItinPlan.ItineraryPlanDetailsObject, ...groupnewDetailObject];
              targetItinPlan.ItineraryPlanSeqObject = [...targetItinPlan.ItineraryPlanSeqObject, ...groupnewSeqObject];
              targetItinPlan.ItineraryPlanGroupObject = [...targetItinPlan.ItineraryPlanGroupObject, ...groupnewGroupObject];

              newGroupObject = [...newGroupObject,...groupnewGroupObject]
              newDetailObject = [...newDetailObject,...groupnewDetailObject] 
              newSeqObject =  [...newSeqObject,...groupnewSeqObject]

            await updateData('DCP', 'itineraryPlan', targetItinPlan.GUID, null, targetItinPlan)
            setAlertContent({
                isOpen: true,
                onClose: () => {
                    setAlertContent({ isOpen: false })
                    setCheckedPool([])
                    dispatch(triggerFetch());
                },
                title: 'Notice',
                msg: 'Update success'
            })
        }

        singleItems?.map((assign, index) => {
            getData('DCP', 'assignment', assign.GUID).then(data => {
                const tempAssignmentData = Object.assign({}, data);
                if (tempAssignmentData.ItineraryPlanObject) {
                    tempAssignmentData.ItineraryPlanObject.splice(0, 1, {
                        GUID: newDetailObject[index].GUID,
                        IPLN_DT: null,
                        //IPLN_DT: addToItinPlanContent.IPLN_DT,
                        IPLN_GUID: targetItinPlan ? targetItinPlan.GUID : newItinPlanGUID,
                        IPLN_SEQ_GUID: newSeqObject[index].GUID,
                    })

                } else {
                    tempAssignmentData.ItineraryPlanObject = [{
                        GUID: newDetailObject[index].GUID,
                        IPLN_DT: null, // Consider uncommenting if you need to use addToItinPlanContent.IPLN_DT
                        IPLN_GUID: targetItinPlan ? targetItinPlan.GUID : newItinPlanGUID,
                        IPLN_SEQ_GUID: newSeqObject[index].GUID
                    }];                    
                }
                updateData('DCP', 'assignment', assign.GUID, null, tempAssignmentData)
            })
        })

        //Handle API
        const submitData = {
            itineraryPlan_setList: targetItinPlan ? null : [
                {
                    RecordState: 'I',
                    IPLN_STS: 'D',
                    GUID: newItinPlanGUID,
                    STF_UID: user.id,
                    STF_NO: user.stf_no,
                    IPLN_UID: null,
                    //IPLN_DT: null,
                    IPLN_DT: addToItinPlanContent.IPLN_DT
                }
            ],
            itineraryPlanItm_setList: newDetailObject?.map(item => ({
                ...item,
                RecordState: 'I',
                IPLN_UID: targetItinPlan ? targetItinPlan.IPLN_UID : null,
                IPLN_GUID: targetItinPlan ? targetItinPlan.GUID : newItinPlanGUID
            })),
            itineraryPlanSeq_setList: newSeqObject?.map(item => ({
                ...item,
                RecordState: 'I',
                IPLN_UID: targetItinPlan ? targetItinPlan.IPLN_UID : null,
                IPLN_GUID: targetItinPlan ? targetItinPlan.GUID : newItinPlanGUID
            })),
            itineraryPlanGrp_setList: newGroupObject?.map(item => ({
                ...item,
                RecordState: 'I',
                IPLN_UID: targetItinPlan ? targetItinPlan.IPLN_UID : null,
                IPLN_GUID: targetItinPlan ? targetItinPlan.GUID : newItinPlanGUID
            })),
        }
        await checkNet(dispatch(updateItineraryPlan(submitData)));
        setIsLoading(false);
    }

    const onChangeAddToItinPlanForm = (key, value, type) => {
        let tempValue = { [key]: type == 'time' ? moment(addToItinPlanContent[key]).set('hour', value.split(':')[0]).set('minute', value.split(':')[1]).toISOString(true) : value }
        setAddToItinPlanContent({
            ...addToItinPlanContent,
            ...tempValue,
        });
    }

    //  [20250402] Disabled due to user consent not showing memory usage to end-user, only reserve for development usage
    // useEffect(() => {
    //     if(isMonitorMemory){
    //         const timer = setInterval(() => {
    //             //const temp = console.memory
    //             //const temp2 = window.performance.memory
    //             const temp3 = performance.memory
    //             // if (window.performance.memory) {
    //             //     console.log("[debug] window.performance.memory", window.performance.memory)
    //             //     console.log("[debug] console.memory", console.memory)
    //             //     setDebugUseMemory(`[Memory usage: ${(window.performance.memory.usedJSHeapSize / (1024 * 1024)).toFixed(2)}/${(window.performance.memory.jsHeapSizeLimit / (1024 * 1024)).toFixed(0)} MB]`)
    //             // } else {
    //             //     setDebugUseMemory('Memory information is not available in this browser.');
    //             // }

    //             if(temp3){
    //                 setDebugUseMemory(`[Memory usage: ${(temp3.usedJSHeapSize / (1024 * 1024)).toFixed(2)}/${(temp3.jsHeapSizeLimit / (1024 * 1024)).toFixed(0)} MB]`)
    //                 //setDebugUseMemory(`[Memory usage: ${(window.performance.memory.usedJSHeapSize / (1024 * 1024)).toFixed(2)}/${(window.performance.memory.jsHeapSizeLimit / (1024 * 1024)).toFixed(0)} MB]`)
    //             } else {
    //                 setDebugUseMemory('Memory information is not available in this browser.');
    //             }
    //         }, 3000);
    //         return () => clearInterval(timer);
    //     }
    // }, []);

    const onDownloadAssignment = async () => {
        if (!checkedPool.length) {
            setAlertContent({
                isOpen: true,
                onClose: () => {
                    setAlertContent({ isOpen: false })
                },
                title: 'Warning',
                msg: 'Please select assignment(s)'
            })
            return
        }

        setIsLoading(true);
        const user = tokenDecoder();

        try {
            await dispatch(downloadAssignment({
                pStaffPositionUid: user?.stf_position,
                pGuidList: checkedPool.map(item => ({
                    RecordState: "I",
                    ASGN_GUID: item.GUID
                })),
            })).unwrap()
            downloadOfflineData()
        } catch (action) {
            setIsLoading(false);
            setAlertContent({
                isOpen: true,
                onClose: () => {
                    setAlertContent({ isOpen: false })
                },
                title: 'Warning',
                msg: action.message,
            })
        }

    }

    const downloadOfflineData = async () => {
        setIsLoading(true);

        try {
            const assignmentRequests = checkedPool.map(item => (
                dispatch(getAssignmentDetail({
                    pAssignmentGuid: item.GUID,
                    pStaffUid: user.id,
                    pStaffPositionUid: user.stf_position,
                })).unwrap().then(result => result.data)
            ))

            const efcRequests = checkedPool.map(item => (
                dispatch(getEFieldCardByAssignmentGuid({
                    pAssignmentGuid: item.GUID,
                })).unwrap().then(result => result.data.eFieldCard)
            ))


            const assignmentFullResponse = await Promise.all(assignmentRequests)
            const assignmentResponse = assignmentFullResponse.map(item => {
                // const oriRecord = tableContent.find(oriItem => item.GUID == item.GUID)
                // setTableContent([
                //     ...tableContent,
                //     {
                //         ...oriRecord,
                //         ...item,
                //         DLREC_STS: "A",
                //     }
                // ])
                return item.assignment
            })
            const efcResponse = await Promise.all(efcRequests)
            const questionnaireList = assignmentFullResponse.map(item => {
                return {
                    questionnaire: item.questionnaire,
                    GUID: item.assignment.TEMP_DOC_REF_NO + '_' + item.assignment.TMPL_VLD_VER_NO,
                    DOC_REF_NO: item.assignment.TEMP_DOC_REF_NO,
                    SRVY_UID: item.assignment.SRVY_UID,
                }
            })

            await addData('DCP', 'assignment', assignmentResponse, 'GUID', false)
            await addData('DCP', 'eFieldCard', efcResponse.flat(), 'GUID', false)
            assignmentResponse && addData('DCP', 'questionnaire', questionnaireList, 'DOC_REF_NO', false);

            await dispatch(getSegmentMapCoordinateByStaffUid({ pStaffUid: user.id })).unwrap().then(action => {
                if (action?.status == '200' && action.data.ErrCode != 1) {
                    addData('DCP', 'segmentCoor', action.data.coordinateList, 'SEG_UID', false);
                }
            });

            setAlertContent({
                isOpen: true,
                onClose: () => {
                    setIsLoading(false);
                    setAlertContent({ isOpen: false })
                    dispatch(triggerFetch())
                },
                title: 'Notice',
                msg: 'Selected assignment(s) are downloaded successfully'
            })
        } catch (action) {
            setAlertContent({
                isOpen: true,
                onClose: () => {
                    setAlertContent({ isOpen: false })
                },
                title: 'Warning',
                msg: action.message,
            })
        }
        setIsLoading(false);
    }

    const onRefreshAssignment = async () => {
        setIsRequireReload(true);
        dispatch(triggerFetch());
    }



    const fetchAssignData = async () => {
        //Get Assignment Data
        // if (formContent.page * formContent.pageSize - formContent.pageSize > totalCount && formContent.page != 1) {
        //     setFormContent({
        //         ...formContent,
        //         page: Math.ceil(totalCount / formContent.pageSize).toString()
        //     })
        //     return
        // }

        if (localStorage.getItem('IS_ONLINE') == 'false') {
            throw new Error('Offline mode')
        }

        const { SRVY_UID, SRVY_CYCLE_UID, TPU, SB, TEL, ASGN_STS, ENUM_RSLT_CD, LST_APPT_INTV_MDE, LST_APPT_DT_NEW,
            OQ_ACCT_IND, RFSL_IND, ASGN_PRTY, BKM, RemarkList,
            REPT_ASGN_UID, PAIR_VST_IND, SEG_KEY, SDU, FLD_OS_IND, NFA_IND, NFV_IND, HLD_STS, totalOp, totalNum, dayOp,
            dayNum, nightOp, nightNum, POOL_OU_UID, TEAM_OU_UID, RESP_STF_UID, RESP_POSN_UID, pAddress,
            pReallocInd, pBldgCsuId, pFuQcInd, REPT_ASGN_RMKS_IND, sort_type, sorting_order, GRP_NAME
        } = filterFormContent;
        let isAsc = sorting_order != null && sorting_order == 'desc' ? false : true
        
        let sort = sortType?.map((val, index) => {
            const [sort_type , sort_order] = val.value.split('-')
            return {
                "Seq": index,
                "FieldName": sort_type,
                "Ascending": sort_order === 'ASC' ? true : false
            }
        })

        let basicFilter = {
            // pAsgnRefNo: "string",
            pSrchRslt: pAddress,
            pAsgnSts: ASGN_STS,
            // pEnqCd: "string",
            pTel: TEL,
            pEnumRsltCd: ENUM_RSLT_CD,
            pOqReg: OQ_ACCT_IND,
            pRfslInd: RFSL_IND,
            pPrtyFrm: ASGN_PRTY && ASGN_PRTY.length > 0 ? ASGN_PRTY[0] : 0,
            pPrtyTo: ASGN_PRTY && ASGN_PRTY.length > 0 ? ASGN_PRTY[1] : 100,
            pReptInd: REPT_ASGN_UID,
            pNoOfTtlVst: totalNum,
            pNoOfTtlVstOpr: totalOp,
            pNoOfDayVst: dayNum,
            pNoOfDayVstOpr: dayOp,
            pNoOfNightVst: nightNum,
            pNoOfNightVstOpr: nightOp,
            pAsgnGrpName: GRP_NAME,
        }
        let advancedFilter = {
            pSrvyUid: SRVY_UID,
            pScUid: SRVY_CYCLE_UID,
            pApptDate: LST_APPT_DT_NEW,
            pTpu: TPU,
            pSb: SB,
            pApptMde: LST_APPT_INTV_MDE,
            pBkmInd: BKM,
            pRmksInd: RemarkList,
            pLastRoundRmksInd: REPT_ASGN_RMKS_IND ? 'Y' : null,
            pNFAInd: NFA_IND ? 'Y' : null,
            pNFVInd: NFV_IND ? 'Y' : null,
            pHldInd: HLD_STS ? 'Y' : null,
            pReallocInd: pReallocInd ? 'Y' : null,
            pBldgCsuId: pBldgCsuId,
            pFuQcInd: pFuQcInd,
            pPairVstInd: PAIR_VST_IND,
            pSegInd: SEG_KEY,
            pSduInd: SDU,
            pPoolOrgUnitUid: POOL_OU_UID,
            pTeamOrgUnitUid: TEAM_OU_UID,
            pRespStfUid: RESP_STF_UID,
            // pRespPosnUid: RESP_POSN_UID,
            pOsInd: FLD_OS_IND ? "Y" : null,
        }

        let action;

        // if (assignRefList.length < 1 && !ASGN_STS) {
        //     setAlertContent({
        //         isOpen: true,
        //         title: 'Warning',
        //         msg: 'Please select at least one assignment status to search',
        //         onClose: () => {
        //             setAlertContent({
        //                 isOpen: false,
        //                 msg: '',
        //                 onClose: null
        //             })
        //         }
        //     });
        //     return;
        // }

        if (hasAdvanceFilter) {
            action = await dispatch(getAssignmentByStaffUidByPage(
                {
                    filter: { ...basicFilter, ...hasAdvanceFilter ? advancedFilter : {} },
                    OrderBy:sort,
                    pSatffPositionUid: user.stf_position,
                    PageNumber: formContent.page,
                    PageSize: formContent.pageSize,
                }
            )).unwrap()
        } else {
            action = await dispatch(getAssignmentListByStaffPositionUidByPageBasic(
                {
                    filter: { ...basicFilter, ...hasAdvanceFilter ? advancedFilter : {} },
                    OrderBy:sort,
                    pSatffPositionUid: user.stf_position,
                    PageNumber: formContent.page,
                    PageSize: formContent.pageSize,
                }
            )).unwrap()
        }
         

        if (action?.status != '200' || action.data.ErrCode == 1) {
            throw new Error()
        }

        const data = action.data.AssginmentList?.map(item => ({
            ...item,
            English_Full_Address: [item.ADDR_ENG_1, item.ADDR_ENG_2, item.ADDR_ENG_3, item.ADDR_ENG_4, item.ADDR_ENG_5].filter(add => add && add != '').join(', '),
            Chinese_Full_Address: [item.ADDR_CHI_1, item.ADDR_CHI_2, item.ADDR_CHI_3, item.ADDR_CHI_4, item.ADDR_CHI_5].filter(add => add && add != '').join(', '),
            English_Full_Mail_Address: [item.MAIL_ADDR_ENG_1, item.MAIL_ADDR_ENG_2, item.MAIL_ADDR_ENG_3, item.MAIL_ADDR_ENG_4, item.MAIL_ADDR_ENG_5, item.MAIL_ADDR_ENG_6].filter(add => add && add != '').join(', '),
            Chinese_Full_Mail_Address: [item.MAIL_ADDR_CHI_1, item.MAIL_ADDR_CHI_2, item.MAIL_ADDR_CHI_3, item.MAIL_ADDR_CHI_4, item.MAIL_ADDR_CHI_5, item.MAIL_ADDR_CHI_6].filter(add => add && add != '').join(', '),
            LQ_Address: item.ADDR_ENG_2 + " " + item.ADDR_ENG_3 + item.ADDR_ENG_4,
            GUID: item.GUID ? item.GUID : uuid(),
            AppointmentBookingObject: item.AppointmentBookingObject?.map(appoint => ({
                ...appoint,
                ASGN_GUID: item.GUID
            })),
            FETCH_DATE: moment().toISOString(true)
        }));


        await addData('DCP', 'assignment', data, 'GUID', false)

        // setTotalCount(action.data.TotalCount)
        // setHeaderContent({
        //     totalHold: action.data.TotalHld,
        //     totalOutstanding: action.data.TotalOs,
        // })

        return data.filter(assign => assign.IS_SHOW);

    }

    const fetchPageData = async () => {

        if (localStorage.getItem('IS_ONLINE') == 'false') {
            throw new Error('Offline mode')
        }

        const { SRVY_UID, SRVY_CYCLE_UID, TPU, SB, TEL, ASGN_STS, ENUM_RSLT_CD, LST_APPT_INTV_MDE, LST_APPT_DT_NEW,
            OQ_ACCT_IND, RFSL_IND, ASGN_PRTY, BKM, RemarkList,
            REPT_ASGN_UID, PAIR_VST_IND, SEG_KEY, SDU, FLD_OS_IND, NFA_IND, NFV_IND, HLD_STS, totalOp, totalNum, dayOp,
            dayNum, nightOp, nightNum, POOL_OU_UID, TEAM_OU_UID, RESP_STF_UID, RESP_POSN_UID, pAddress,
            pReallocInd, pBldgCsuId, pFuQcInd, REPT_ASGN_RMKS_IND, GRP_NAME
        } = filterFormContent;


        let basicFilter = {
            // pAsgnRefNo: "string",
            pSrchRslt: pAddress,
            pAsgnSts: ASGN_STS,
            // pEnqCd: "string",
            pTel: TEL,
            pEnumRsltCd: ENUM_RSLT_CD,
            pOqReg: OQ_ACCT_IND,
            pRfslInd: RFSL_IND,
            pPrtyFrm: ASGN_PRTY && ASGN_PRTY.length > 0 ? ASGN_PRTY[0] : 0,
            pPrtyTo: ASGN_PRTY && ASGN_PRTY.length > 0 ? ASGN_PRTY[1] : 100,
            pReptInd: REPT_ASGN_UID,
            pNoOfTtlVst: totalNum,
            pNoOfTtlVstOpr: totalOp,
            pNoOfDayVst: dayNum,
            pNoOfDayVstOpr: dayOp,
            pNoOfNightVst: nightNum,
            pNoOfNightVstOpr: nightOp,
            pAsgnGrpName: GRP_NAME,
        }
        
        let advancedFilter = {
            pSrvyUid: SRVY_UID,
            pScUid: SRVY_CYCLE_UID,
            pApptDate: LST_APPT_DT_NEW,
            pTpu: TPU,
            pSb: SB,
            pApptMde: LST_APPT_INTV_MDE,
            pBkmInd: BKM,
            pRmksInd: RemarkList,
            pLastRoundRmksInd: REPT_ASGN_RMKS_IND ? 'Y' : null,
            pNFAInd: NFA_IND ? 'Y' : null,
            pNFVInd: NFV_IND ? 'Y' : null,
            pHldInd: HLD_STS ? 'Y' : null,
            pReallocInd: pReallocInd ? 'Y' : null,
            pBldgCsuId: pBldgCsuId,
            pFuQcInd: pFuQcInd,
            pPairVstInd: PAIR_VST_IND,
            pSegInd: SEG_KEY,
            pSduInd: SDU,
            pPoolOrgUnitUid: POOL_OU_UID,
            pTeamOrgUnitUid: TEAM_OU_UID,
            pRespStfUid: RESP_STF_UID,
            // pRespPosnUid: RESP_POSN_UID,
            pOsInd: FLD_OS_IND ? "Y" : null,
        }

        let action;

        // if (assignRefList.length < 1 && !ASGN_STS) {
        //     setAlertContent({
        //         isOpen: true,
        //         title: 'Warning',
        //         msg: 'Please select at least one assignment status to search',
        //         onClose: () => {
        //             setAlertContent({
        //                 isOpen: false,
        //                 msg: '',
        //                 onClose: null
        //             })
        //         }
        //     });
        //     return;
        // }
        setLoadSpinnerVisible(true)
        if(hasAdvanceFilter){
            action = await dispatch(getAssignmentListByStaffPositionUidByPageTotalCount(
                {
                    filter: { ...basicFilter, ...hasAdvanceFilter ? advancedFilter : {} },
                    pSatffPositionUid: user.stf_position,
                    PageNumber: formContent.page,
                    PageSize: formContent.pageSize,
                }
            )).unwrap()
        } else{
            action = await dispatch(getAssignmentListByStaffPositionUidByPageBasicTotalCount(
                {
                    filter: { ...basicFilter, ...hasAdvanceFilter ? advancedFilter : {} },
                    pSatffPositionUid: user.stf_position,
                    PageNumber: formContent.page,
                    PageSize: formContent.pageSize,
                }
            )).unwrap()
        }

        if (action?.status != '200' || action.data.ErrCode == 1) {
            throw new Error()
        }
        // const data = action.data.AssginmentList?.map(item => ({
        //     ...item,
        // }));

        // await addData('DCP', 'assignment', data, 'GUID', false)

        setTotalCount(action.data.TotalCount)
        setHeaderContent({
            totalHold: action.data.TotalHld,
            totalOutstanding: action.data.TotalOs,
        })

        // return data.filter(assign => assign.IS_SHOW);

    }

    const fetchAssignmentMapData = async () => {
        //Get Assignment Data

        const { SRVY_UID, SRVY_CYCLE_UID, TPU, SB, TEL, ASGN_STS, ENUM_RSLT_CD, LST_APPT_INTV_MDE, LST_APPT_DT_NEW,
            OQ_ACCT_IND, RFSL_IND, ASGN_PRTY, BKM, RemarkList,
            REPT_ASGN_UID, PAIR_VST_IND, SEG_KEY, SDU, FLD_OS_IND, NFA_IND, NFV_IND, HLD_STS, totalOp, totalNum, dayOp,
            dayNum, nightOp, nightNum, POOL_OU_UID, TEAM_OU_UID, RESP_STF_UID, RESP_POSN_UID, pAddress, pFuQcInd,
            pBldgCsuId, pReallocInd, REPT_ASGN_RMKS_IND, GRP_NAME
        } = filterFormContent;

        const action = await dispatch(getAssignmentInfoListByStaffUid(
            {
                filter: {
                    pSrvyUid: SRVY_UID,
                    pScUid: SRVY_CYCLE_UID,
                    pAsgnSts: ASGN_STS,
                    pApptDate: LST_APPT_DT_NEW,
                    pSrchRslt: pAddress,
                    pTel: TEL,
                    pTpu: TPU,
                    pSb: SB,
                    pEnumRsltCd: ENUM_RSLT_CD,
                    pApptMde: LST_APPT_INTV_MDE,
                    pOqReg: OQ_ACCT_IND,
                    pRfslInd: RFSL_IND,
                    pPrtyFrm: ASGN_PRTY && ASGN_PRTY.length > 0 ? ASGN_PRTY[0] : 0,
                    pPrtyTo: ASGN_PRTY && ASGN_PRTY.length > 0 ? ASGN_PRTY[1] : 100,
                    pBkmInd: BKM,
                    pRmksInd: RemarkList,
                    pReptInd: REPT_ASGN_UID,
                    REPT_ASGN_RMKS_IND: REPT_ASGN_RMKS_IND ? 'Y' : null,
                    pNFAInd: NFA_IND ? 'Y' : null,
                    pNFVInd: NFV_IND ? 'Y' : null,
                    pHldInd: HLD_STS ? 'Y' : null,
                    pReallocInd: pReallocInd ? 'Y' : null,
                    pBldgCsuId: pBldgCsuId,
                    pFuQcInd: pFuQcInd,
                    pPairVstInd: PAIR_VST_IND,
                    pSegInd: SEG_KEY,
                    pSduInd: SDU,
                    pNoOfTtlVst: totalNum,
                    pNoOfTtlVstOpr: totalOp,
                    pNoOfDayVst: dayNum,
                    pNoOfDayVstOpr: dayOp,
                    pNoOfNightVst: nightNum,
                    pNoOfNightVstOpr: nightOp,
                    pPoolOrgUnitUid: POOL_OU_UID,
                    pTeamOrgUnitUid: TEAM_OU_UID,
                    pRespStfUid: RESP_STF_UID,
                    pRespPosnUid: RESP_POSN_UID,
                    pOsInd: FLD_OS_IND ? "Y" : null,
                    pAsgnGrpName: GRP_NAME
                },
                pSatffPositionUid: user.stf_position,
                PageNumber: 1,
                PageSize: 1000,
            }
        )).unwrap()

        if (action?.status != '200' || action.data.ErrCode == 1) {
            throw new Error()
        }

        const data = action.data.AssginmentList?.map(item => ({
            ...item,
            English_Full_Address: [item.ADDR_ENG_1, item.ADDR_ENG_2, item.ADDR_ENG_3, item.ADDR_ENG_4, item.ADDR_ENG_5/*, item.DCCA_ENG*/].filter(add => add && add != '').join(', '),
            Chinese_Full_Address: [item.ADDR_CHI_1, item.ADDR_CHI_2, item.ADDR_CHI_3, item.ADDR_CHI_4, item.ADDR_CHI_5].filter(add => add && add != '').join(', '),
            English_Full_Mail_Address: [item.MAIL_ADDR_ENG_1, item.MAIL_ADDR_ENG_2, item.MAIL_ADDR_ENG_3, item.MAIL_ADDR_ENG_4, item.MAIL_ADDR_ENG_5, item.MAIL_ADDR_ENG_6/*, item.DCCA_ENG*/].filter(add => add && add != '').join(', '),
            Chinese_Full_Mail_Address: [item.MAIL_ADDR_CHI_1, item.MAIL_ADDR_CHI_2, item.MAIL_ADDR_CHI_3, item.MAIL_ADDR_CHI_4, item.MAIL_ADDR_CHI_5, item.MAIL_ADDR_CHI_6].filter(add => add && add != '').join(', '),
            LQ_Address: item.ADDR_CHI_5,
            GUID: item.GUID ? item.GUID : uuid(),
        }))
        return data;
    }

    const fetchContactData = async () => {
        //Get Assignment Data
        const action = await getAllData('DCP', 'hhContact')
        return action
    }

    const dispatchData = async () => {
        try {
            setLoadSpinnerVisible(true)
            const promises = [fetchAssignData(), fetchDataFromLocal(), fetchContactData()]
            const response = await Promise.all(promises)
            // const [assignData, assignMapData2, contactList] = await Promise.all(promises)
            // for (const promise of promises) {
            //     const result = await promise()
            //     response.push(result)
            // }
            setIsLoading(false)

            const [assignData, assignMapData2, contactList] = response

            //console.log("[debug] assignMapData2", assignMapData2);
            setTableContent(assignData)
            submitFilterForm(filterFormContent, assignMapData2, contactList);
            setContactList(contactList)
            const pagePromise = [fetchPageData()]
            const pageResponse = await Promise.all(pagePromise)
            setLoadSpinnerVisible(false)
            // await dispatch(getSurveyList({}))

            // if (searchParams.get('sc')) {
            //     const newParams = { ...filterFormContent, ...JSON.parse(searchParams.get('sc')) }

            //     Object.keys(newParams).filter(scKey => !Object.keys(filterFormContent).some(localKey => localKey == scKey)).map(scKey => {
            //         delete newParams[scKey]
            //     });

            //     setFilterFormContent(newParams)
            //     const result = submitFilterForm(newParams, assignMapData2, contactList)
            //     setTableContent(result.filter((_, index) => index >= (formContent.pageSize * (formContent.page - 1)) && index < (formContent.pageSize * (formContent.page))))
            //     setDisplayAssignMapData(result)
            //     setTotalCount(result.length)

            //     setIsFilterOn(false)
            // } else {
            //     const result = submitFilterForm(filterFormContent, assignMapData2, contactList)
            //     setTableContent(result.filter((_, index) => index >= (formContent.pageSize * (formContent.page - 1)) && index < (formContent.pageSize * (formContent.page))))
            //     setDisplayAssignMapData(result)
            //     setTotalCount(result.length)
            //     // setTableContent(assignData);
            // }
        } catch {
            const assignLocalData = await fetchDataFromLocal()
            const contactList = await getAllData('DCP', 'hhContact')
            setContactList(contactList)

            if (searchParams.get('sc')) {
                const newParams = { ...filterFormContent, ...JSON.parse(searchParams.get('sc')) }
                Object.keys(newParams).filter(scKey => !Object.keys(filterFormContent).some(localKey => localKey == scKey)).map(scKey => {
                    delete newParams[scKey]
                });
                setFilterFormContent(newParams)
                const result = submitFilterForm(newParams, assignLocalData, contactList)
                setTableContent(result.filter((_, index) => index >= (formContent.pageSize * (formContent.page - 1)) && index < (formContent.pageSize * (formContent.page))))
                setDisplayAssignMapData(result)
                setTotalCount(result.length)
                setIsFilterOn(false)
            } else {
                const result = submitFilterForm(filterFormContent, assignLocalData, contactList)
                setTableContent(result.filter((item, index) => index >= (formContent.pageSize * (formContent.page - 1)) && index < (formContent.pageSize * (formContent.page))))
                setDisplayAssignMapData(result)
                setTotalCount(result.length)
            }
        }
        setRefreshTime(moment().format('y-MM-DD HH:mm'));
        setLoadSpinnerVisible(false);
    }

    const onChangeUpdateForm = (key, value, type) => {
        let tempValue = { [key]: type == 'time' ? moment(content[key]).set('hour', value.split(':')[0]).set('minute', value.split(':')[1]).toISOString(true) : value }
        setSelectItineraryPlanContent(prev => ({
            ...prev,
            ...tempValue,
        }));
    }

    const onRemoveAssignment = async () => {
        setIsLoading(true);
        const targetIplnIndex = selectItineraryPlanContent.itinPlanList.findIndex(item => item.GUID == selectItineraryPlanContent.GUID);
        const targetIpln = selectItineraryPlanContent.itinPlanList[targetIplnIndex];
        //handle index db
        await getData('DCP', 'assignment', selectItineraryPlanContent.ASGN_GUID).then(async assign => {
            const tempData = Object.assign({}, assign);
            tempData.ItineraryPlanObject.splice(targetIplnIndex, 1);
            updateData('DCP', 'assignment', selectItineraryPlanContent.ASGN_GUID, null, tempData)
            await getData('DCP', 'itineraryPlan', targetIpln.IPLN_GUID).then(async itinPlan => {
                if (itinPlan) {
                    const tempItinPlan = Object.assign({}, itinPlan);
                    const targetSeqObjIndex = tempItinPlan.ItineraryPlanSeqObject.findIndex(seqObj => seqObj.GUID == targetIpln.IPLN_SEQ_GUID);
                    tempItinPlan.ItineraryPlanSeqObject.splice(targetSeqObjIndex, 1);
                    const targetDetailObjIndex = tempItinPlan.ItineraryPlanDetailsObject.findIndex(detailObj => detailObj.GUID == targetIpln.GUID);
                    tempItinPlan.ItineraryPlanDetailsObject.splice(targetDetailObjIndex, 1);
                    await updateData('DCP', 'itineraryPlan', tempItinPlan.GUID, null, tempItinPlan)
                }
            })
        })

        //Handle API
        const submitData = {
            itineraryPlanItm_setList: [
                {
                    IPLN_ITM_UID: targetIpln.IPLN_ITM_UID,
                    GUID: targetIpln.GUID,
                    ASGN_GUID: selectItineraryPlanContent.ASGN_GUID,
                    RecordState: "D"
                }
            ],
            itineraryPlanSeq_setList: [
                {
                    IPLN_SEQ_UID: targetIpln.IPLN_SEQ_UID,
                    GUID: targetIpln.IPLN_SEQ_GUID,
                    IPLN_UID: targetIpln.IPLN_UID,
                    IPLN_GUID: targetIpln.IPLN_GUID,
                    IPLN_ITM_UID: targetIpln.IPLN_ITM_UID,
                    IPLN_ITM_GUID: targetIpln.GUID,
                    ASGN_GUID: selectItineraryPlanContent.ASGN_GUID,
                    RecordState: "D"
                }
            ],
        }
        await checkNet(dispatch(updateItineraryPlan(submitData)))
        setSelectItineraryPlanContent({ isOpen: false })
        setAlertContent({
            isOpen: true,
            onClose: () => {
                setAlertContent({ isOpen: false })
                setCheckedPool([])
                dispatch(triggerFetch());
            },
            title: 'Notice',
            msg: 'Update success'
        })
        setIsLoading(false);
    }

    const onClickSketchMap = async (assignment, id) => {
        if (process.env.IS_ONLINE == 'true' && localStorage.getItem('IS_ONLINE') == 'true') {
            const apiResult = await dispatch(getEFieldCardByAssignmentGuid({ pAssignmentGuid: assignment.GUID }))
            const { eFieldCard } = apiResult?.payload?.data;
            // const resultList = apiResult?.payload?.data.eFieldCard;
            // const eFieldCard = resultList.find(eFieldCard => eFieldCard.ASGN_GUID === assignment.GUID)
            if (eFieldCard) {
                const sketchMap = eFieldCard.flatMap(card => card.EFieldCardSpecificInfoImageObject?.filter(
                    item => item.STS != 'D' && (item.FILE_TYP == 'S' || item.FILE_TYP == 'M')/*item.MAP_TYP == 'SKH'*/))
                // const sketchMap = eFieldCard?.EFieldCardSpecificInfoImageObject?.filter(item => item.STS != 'D' && item.FILE_TYP == 'M');
                if (sketchMap && sketchMap.length > 0) {
                    setImageTableContent(orderBy(sketchMap?.map(item => ({
                        ...item,
                        GUID: item.GUID ? item.GUID : uuid()
                    })), ['FILE_NAME'], ['asc']));
                } else {
                    setAlertContent({
                        isOpen: true,
                        title: 'Warning',
                        msg: 'No sketch map.',
                        onClose: () => {
                            setAlertContent({
                                isOpen: false,
                                msg: '',
                                onClose: null
                            })
                        }
                    });
                    return;
                }
            }
        } else {
            getData('DCP', 'eFieldCard', id).then(async eFieldCard => {
                if (eFieldCard) {
                    const sketchMap = eFieldCard?.EFieldCardSpecificInfoImageObject?.filter(item => item.STS != 'D' && item.FILE_TYP == 'M');
                    if (sketchMap && sketchMap.length > 0) {
                        setImageTableContent(orderBy(sketchMap?.map(item => ({
                            ...item,
                            GUID: item.GUID ? item.GUID : uuid()
                        })), ['FILE_NAME'], ['asc']));
                    } else {
                        setAlertContent({
                            isOpen: true,
                            title: 'Warning',
                            msg: 'No sketch map.',
                            onClose: () => {
                                setAlertContent({
                                    isOpen: false,
                                    msg: '',
                                    onClose: null
                                })
                            }
                        });
                        return;
                    }

                } else {
                    setAlertContent({
                        isOpen: true,
                        title: 'Warning',
                        msg: 'No E-field card',
                        onClose: () => {
                            setAlertContent({
                                isOpen: false,
                                msg: '',
                                onClose: null
                            })
                        }
                    });
                }
            })
        }
    }

    const onClickSegmentMap = async (assignment) => {
        if (assignment.SEG_UID) {
            setESegmentDetail({
                isOpen: true,
                onCloseModal: () => setESegmentDetail({ isOpen: false }),
                assignment: assignment,
                isPreview: true,
            })
        } else {
            setAlertContent({
                isOpen: true,
                onClose: () => setAlertContent({ isOpen: false }),
                title: 'Warning',
                msg: 'No segment map'
            })
        }
    }

    const updateImageForm = (key, value, type) => {
        let tempValue = { [key]: value == '' ? null : value }

        setImageFormContent(previousInputs => ({
            ...previousInputs,
            ...tempValue,
        }));
    }

    const onClickImageDetail = (content) => {
        setImageContentDetail({
            ...content,
        });
    }

    const onClickFilterForm = async (filter) => {
        setCheckedPool([])
        setSelectedLoc(null);
        setFormContent(c => ({
            ...c,
            page: 1,
            offSet: 0,
        }))
    }

    const toggleMap = () => {
        setPanelAction({
            panel: 'right',
            action: (ref) => {
                if (ref.current.getSize() <= 60) {
                    ref.current.resize(550)
                } else {
                    ref.current.resize(0)
                }
            }
        })
    }

    return (
        <>
            <SlidableContainer
                customMinRight={50}
                panelAction={panelAction}
            >
                <div id='assignment'>

                    <div className='lastupdate'>
                        Last refresh: {refreshTime}
                    </div>
                    <Container className='searchBarContainer'>
                        {/* <div className="searchFieldWrapper"> */}
                        <Input
                            className='searchField'
                            // 20250228 - revert trim action as backend will handle the space issue for tel related fields
                            // onChange={(e) => updateFilterForm('searchText', e.target.value.trim())}
                            onChange={(e) => updateFilterForm('searchText', e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder={'Assignment Ref'}
                            value={filterFormContent.searchText}
                        />
                        <Input
                            className='searchField'
                            // 20250228 - revert trim action as backend will handle the space issue for tel related fields
                            // onChange={(e) => updateFilterForm('searchText1', e.target.value.trim())}
                            onChange={(e) => updateFilterForm('searchText1', e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder={'Address'}
                            value={filterFormContent.searchText1}
                        />
                        {/* <Tooltip label="Search">
                                <div
                                    className="icon_magnifier"
                                    onClick={handleAddressFilter}
                                ></div>
                            </Tooltip> */}
                        {/* </div> */}
                        <Tooltip label="Search"><div className='icon_magnifier2' onClick={handleAddressFilter} ></div></Tooltip>
                        <Tooltip label="Filter"><div className='icon_filter' onClick={() => setIsFilterOn(!isFilterOn)} ></div></Tooltip>
                        <Tooltip label="Refresh"><div className="icon_refresh" onClick={onRefreshAssignment} ></div></Tooltip>
                    </Container>
                    <Container className='assignmentInfoContainer fieldContainer resultCountWrapper'>
                        <div>Total assignment: {headerContent.totalOutstanding ?? 0}</div>
                        <div>Total hold: {headerContent.totalHold ?? 0}</div>
                        <div className='fieldItem'>
                            No. of Search Result ({totalCount})
                            <Tooltip label="Select all assignments">
                                <div className='checker_wrapper'>
                                    <Checkbox className='checkBox'
                                        isChecked={checkedPool.length == tableContent?.length}
                                        onChange={() => onClickAllCheckBox()}
                                    />
                                </div>
                            </Tooltip>
                        </div>
                        {isFilterOn && <div className='flex adv_search'>
                            <div className='checker_wrapper'>
                                <Switch
                                    isChecked={hasAdvanceFilter}
                                    onChange={() => setHasAdvanceFilter(!hasAdvanceFilter)}
                                />
                            </div>
                            Advanced Search Filter
                        </div>
                        }
                    </Container>
                    {
                        filterFormContent.pAddress?.length > 0 &&

                        <Container variant='outlinePurple' className='tagPoolContainer'>
                            {
                                filterFormContent.pAddress?.map((item, index) =>
                                    <Tag
                                        text={item}
                                        onDelete={() => handleDeleteTag(index)}
                                    />
                                )
                            }
                        </Container>
                    }
                    {
                        isFilterOn &&

                        <FilterForm
                            formStructure={[...formStructure, ...(hasAdvanceFilter ? advancedformStructure : []), ...(user.isSupervisor && hasAdvanceFilter ? supervisorFormStructure : [])]}
                            formContent={filterFormContent}
                            onChange={setFilterFormContent}
                            isResetAutoSearch={false}
                            defaultFormContent={defaultFormContent}
                            col={3}
                            stringSearchSetter={setAssignRefList}
                            submitAction={handleAddressFilter}
                            setSelectAsgnSTSAllOption={setSelectAsgnSTSAllOption} //Mantis 531
                            setSelectEnumRSLTAllOption={setSelectEnumRSLTAllOption} //Mantis 531
                        />
                    }
                    <Container className="assignmentItemWrapper">
                        {
                            tableContent?.map((content, index) =>
                                generateAssignmentItem(content, index)
                            )
                        }
                    </Container>
                    {
                        loadSpinnerVisible ?
                            <Box className="paginationWrapper centered-spinner">
                                        <div className='flex justify-center items-center pt-5 w-full'>
                                            <Spin className='custom-spinner'/>
                                        </div>
                            </Box>
                        :
                        generatePageController(formContent?.offSet, formContent?.page, updateForm, 5, totalCount, formContent.pageSize)
                    }
                    <Container className='bottomCtrlBtnsWrapper asgnList center'>
                        <Button className="btnSubmitAppr" variant='blue'>
                            <div className="date">
                                <DatePicker
                                    onChange={(e) =>
                                        onChangeAddToItinPlanForm('IPLN_DT', moment(e).format('YYYY-MM-DD'), 'date')
                                    }
                                    value={addToItinPlanContent.IPLN_DT ? new Date(addToItinPlanContent.IPLN_DT) : new Date()}
                                    clearIcon={null}
                                    format="y-MM-dd"
                                    yearPlaceholder="yyyy"
                                    monthPlaceholder="mm"
                                    dayPlaceholder="dd"
                                />
                            </div>
                            <div onClick={() => { onClickAddToItineraryPlanByGroup() }}>Add to itinerary plan<span className="submit_count">{checkedPool.length}</span></div>
                        </Button>
                        <HoldAssignmentButton
                            assignmentList={checkedPool}
                            holdType={3}
                            isHold={true}
                            dispatch={dispatch}
                            setAlertContent={setAlertContent}
                        />
                        <HoldAssignmentButton
                            assignmentList={checkedPool}
                            holdType={3}
                            isHold={false}
                            dispatch={dispatch}
                            setAlertContent={setAlertContent}
                        />
                        <Button variant="blue" onClick={() => { handleAddGroupName(checkedPool) }}>Add Group</Button>
                        <Button variant='purple' onClick={() => { onDownloadAssignment() }}>Download</Button>
                    </Container>
                </div>
                <div className="mapWrapper">
                    <Tooltip label="Expand/Collapse">
                        <div
                            className='icon_expand'
                            onClick={toggleMap}
                        />
                    </Tooltip>
                    {/* CR0006 Mantis141 */}
                    <LeafletMap
                        markerList={markerList}
                        currentPosition={currentPosition}
                        updateCurrentPotition={(position) => setCurrentPosition(position)}
                        zoomScale={zoomScale}
                        selectedLoc={selectedLoc}
                        setSelectedLoc={setSelectedLoc}
                        // needRecenter={true}
                        generateMarkerItems={(markerItem) => {
                            return (
                                <div key={markerItem[0]['GUID']}>
                                    <label className="lq_addr">
                                        {/*
                                        #141 - New requirement to display the name
                                        EST > BLDG > STREET > empty string
                                        */}
                                        {
                                            markerItem[0].EST_NAME_ENG && markerItem[0].EST_NAME_CHI
                                                ? `${markerItem[0].EST_NAME_ENG}, ${markerItem[0].EST_NAME_CHI}`
                                                : markerItem[0].BLDG_NAME_ENG && markerItem[0].BLDG_NAME_CHI
                                                    ? `${markerItem[0].BLDG_NAME_ENG}, ${markerItem[0].BLDG_NAME_CHI}`
                                                    : markerItem[0].STR_NAME_ENG && markerItem[0].STR_NAME_CHI
                                                        ? `${markerItem[0].STR_NAME_ENG}, ${markerItem[0].STR_NAME_CHI}`
                                                        : `,`
                                        }
                                        {/* {`${markerItem[0]?.BLDG_NAME_ENG ?? markerItem[0]?.EST_NAME_ENG ?? markerItem[0]?.EST_NAME_CHI ?? ''}, ${markerItem[0]?.BLDG_NAME_CHI ?? markerItem[0]?.EST_NAME_CHI ?? ''}`} */}
                                    </label>
                                    <div className="addr_list">
                                        {
                                            markerItem?.map(item => {
                                                return (
                                                    <div key={'item_' + item['GUID']} className="case_item">
                                                        <div className={`${item.ItineraryPlanObject?.filter(item => item.IPLN_STS == 'D')?.length > 0 ? 'icon_delete_3' : 'icon_add_2'}`} onClick={() => onClickAddToItineraryPlanBySingle(item)}></div>
                                                        <div className="case_id">Assignment Ref.: {item['ASGN_REF_NO']}</div>
                                                        <div className="addr">
                                                            <span>{item['Chinese_Full_Mail_Address']}</span>
                                                            <span>{(item['English_Full_Mail_Address'])}</span>
                                                        </div>
                                                    </div>
                                                )
                                            })
                                        }
                                    </div>
                                </div>
                            )
                        }}

                        generateMarkerIcons={(markerItem, index, length, isSelected = null) => {
                            return (
                                new DivIcon({
                                    iconSize: [200, 120],
                                    iconAnchor: [12, 41],
                                    html:
                                        `<div class="add_wrapper">
                                            <div class="inner_wrapper">
                                                <span class="icon-text_addr">${markerItem.EST_NAME_ENG ? markerItem.EST_NAME_ENG : (markerItem.BLDG_NAME_ENG ? markerItem.BLDG_NAME_ENG : markerItem.STR_NAME_ENG)?? ''}</span>
                                                <span class="icon-text_addr">${markerItem.EST_NAME_CHI ? markerItem.EST_NAME_CHI : (markerItem.BLDG_NAME_CHI? markerItem.BLDG_NAME_CHI : markerItem.STR_NAME_CHI )?? ''}</span>
                                                <span class="icon-text_addr">No. of cases: ${length}</span>
                                            </div>
                                        </div>`,
                                    className: isSelected == null ? 'icon_marker_text' : isSelected ? 'icon_selected_marker_text' : 'icon_not_selected_marker_text'
                                })
                            )
                        }}
                    />
                </div>
            </SlidableContainer>
            <DisplayDataModal
                title={'Select Itinerary Plan'}
                onCloseModal={() => setSelectItineraryPlanContent({ isOpen: false })}
                isModalOpen={selectItineraryPlanContent.isOpen}
                isFixSize={true}
                minH={400}
            >
                <DataForm
                    tableStructure={selectItineraryPlanContent_structure}
                    content={selectItineraryPlanContent}
                    updateFormAction={onChangeUpdateForm}
                    submitAction={onRemoveAssignment}
                />
            </DisplayDataModal>
            <DisplayDataModal
                title={"Segment Image"}
                onCloseModal={() => {
                    setSegmentImgContent(null);
                }}
                isModalOpen={segmentImgContent != null}
                isFixSize={false}
            >
                <div className="popupForm segmentMapForm">
                    <Box className="modalContainer">
                        <DataForm
                            tableStructure={segmentImgDetailTableStructure}
                            content={segmentImgContent}
                            updateFormAction={() => {
                            }}
                        />
                    </Box>
                </div>
            </DisplayDataModal>

            <DisplayDataModal
                title={"Sketch Map"}
                onCloseModal={() => {
                    if (imageContentDetail)
                        setImageContentDetail(null);
                    else
                        setImageTableContent([])
                }}
                isModalOpen={imageTableContent.length > 0}
                isFixSize={false}
            >
                {
                    !imageContentDetail ?
                        <>
                            <DataTable
                                tableStructure={imageListTableStructure}
                                tableContent={imageTableContent}
                                //tableTitle={'Image'}
                                variant={'roundedGreyHeaderOpenBottom'}
                                setTableContent={setImageTableContent}
                                formContent={imageFormContent}
                            />
                            {generatePageController(imageFormContent?.offSet, imageFormContent?.page, updateImageForm, 5, imageTableContent?.length, imageFormContent?.pageSize)}
                        </>
                        :
                        <div className="popupForm segmentMapForm">
                            <Box className='modalContainer'>
                                <DataForm
                                    tableStructure={imageDetailTableStructure}
                                    content={imageContentDetail}
                                    updateFormAction={() => { }}
                                />
                            </Box>
                        </div >
                }

            </DisplayDataModal>
            <DisplayDataModal
                title='Segment Map'
                isModalOpen={eSegmentDetail.isOpen}
                onCloseModal={() => setESegmentDetail({ isOpen: false })}
            >
                <ESegmentDetail {...eSegmentDetail} />
                <div className="contentWrapper" style={{ width: '100%' }}>
                    <DataTable
                        tableStructure={segmentImageListTableStructure}
                        tableContent={segmentImageTableContent}
                        tableTitle={"Image"}
                        variant={"roundedGreyHeaderOpenBottom"}
                        setTableContent={setSegmentImageTableContent}
                        formContent={imageFormContent}
                    />
                    {generatePageController(imageFormContent?.offSet, imageFormContent?.page, updateImageForm, 5, segmentImageTableContent?.length, imageFormContent?.pageSize)}
                </div>
            </DisplayDataModal>

            <DisplayDataModal
                title="Create Quality Control Task By Assignment"
                isModalOpen={qcContent.isOpen}
                minH={'60vh'}
                //minW={'50vw'}
                onCloseModal={() => setQcContent({ isOpen: false })}
            >
                <GeneralQcDetail
                    qcType={"assignment"}
                    customColspan={1}
                    assignmentList={qcContent.assignmentList}
                    onClose={() => setQcContent({ isOpen: false })} />
            </DisplayDataModal>

            {/** Mantis 8706 Preview Questionnaire Modal */}
            <QuickViewModal 
                isOpen={isQuickViewOpen} 
                onClose={() => setIsQuickViewOpen(false)} 
                guid={selectedAssignmentGuid} 
            />
  
            <AlertModal
                content={alertContent}
            />
            <ConfirmModal1
                content={confirmContent}
            />
            <AssignmentGroup
                visible={showGroupModal}
                selectedRecord={selectedRecord}
                whenCancel={() => setShowUpdateGroupModal(false)}
                // refresh={() => onRefreshAssignment()}
                onConfirm= {() =>handleDeleteWholeGroup(selectedRecord, tableContent)}
                setTableContent= {setTableContent}
                tableContent={tableContent}
            />
            <AddAssignmentGroup
                visible={showAddGroupModal}
                selectedRecord={selectedRecord}
                whenCancel={() => setShowAddGroupModal(false)}
                // refresh={() => onRefreshAssignment()}
                setTableContent= {setTableContent}
                tableContent={tableContent}
            />
        </>
    );
}


function mapStateToProps(state) {
    const { assignment, common, survey } = state;
    return {
        needFetch: common.needFetch,
        approverList: common.approverList,
        assignmentStatusList: common.assignmentStatusList,
        appointmentModeList: common.interviewModeList,
        oqStatusList: common.oqStatusList,
        responsibleOfficerList: common.responsibleOfficerList,
        segmentMapTypeList: common.segmentMapTypeList,
        enumResultList: common.enumResultList,
        interviewModeList: common.interviewModeList,
        assignRefuseIndList: common.assignRefuseIndList,
        pairVisitIndList: common.pairVisitIndList,
        outstandingIndList: common.outstandingIndList,
        highRiskIndList: common.highRiskIndList,
        staffList: common.staffList,
        surveyList: survey.surveyDropdownList,
        surveyRoundList: survey.surveyRoundDropdownList,
        segmentImageTypeList: common.segmentImageTypeList,
        preferTimeList: common.preferTimeList,
        AssignmentSortingList: common.AssignmentSortingList,
        EnumerationModesList: common.EnumerationModesList,
    }
}

export default connect(mapStateToProps)(Assignment);