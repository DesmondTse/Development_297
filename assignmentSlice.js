import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { axios, getterConfig, setterConfig } from '../axiosDispatcher';
import { addData, getAllData } from '../../utils/idbUtils';
import uuid from 'react-uuid';

const initialState = {
    filterData: [],
    assignmentData: [],
    totalPage: 0,
    totalCount: 0,
    localState: {},
    assignmentDetailData: {}
}

//Action Creator
export const getAssignmentListFilter = createAsyncThunk(
    "assignment/GetAssignmentListFilter",
    async (payload, thunkAPI) => {
        const res = await axios(getterConfig).post("Assignment/GetAssignmentListFilter", payload);
        return res;
    }
);

export const getAssignmentByStaffUidByPage = createAsyncThunk(
    "assignment/GetAssignmentListByStaffPositionUidByPage",
    async (payload, thunkAPI) => {
        const res = await axios(getterConfig).post("Assignment/GetAssignmentListByStaffPositionUidByPage", payload);
        return res;
    }
);

export const getAssignmentListByStaffPositionUidByPageBasic = createAsyncThunk(
    "assignment/GetAssignmentListByStaffPositionUidByPageBasic",
    async (payload, thunkAPI) => {
        const res = await axios(getterConfig).post("Assignment/GetAssignmentListByStaffPositionUidByPageBasic", payload);
        return res;
    }
);

export const updateState = createAsyncThunk(
    "assignment/UpdateState",
    async (payload, thunkAPI) => {
        // const res = await axios().post("Assignment/GetAssignmentByStaffUidByPage", payload);
        return payload;
    }
);

export const getAssignmentHouseHoldContactByStaffUid = createAsyncThunk(
    "assignment/GetAssignmentHouseHoldContactByStaffUid",
    async (payload, thunkAPI) => {
        const res = await axios(getterConfig).post("Assignment/GetAssignmentHouseHoldContactByStaffUid", payload);
        return res;
    }
);

export const getAssignmentEnquiryByPage = createAsyncThunk(
    "assignment/GetAssignmentEnquiryByPage",
    async (payload, thunkAPI) => {
        const res = await axios(getterConfig).post("/Assignment/GetAssignmentEnquiryByPage", payload);
        return res;
    }
);

export const getEnquiryStaffList = createAsyncThunk(
    "assignment/GetEnquiryStaffList",
    async (payload, thunkAPI) => {
        const res = await axios(getterConfig).post("/Enquiry/GetEnquiryStaffList", payload);
        return res;
    }
);

export const getAssignmentDetail = createAsyncThunk(
    "assignment/GetAssignmentByGuid",
    async (payload, thunkAPI) => {
        const res = await axios(getterConfig).post("/Assignment/GetAssignmentByGuid", payload);
        return res;
    }
);
 
export const getAssignmentByGuidWithoutViewScope = createAsyncThunk(
    "assignment/GetAssignmentByGuidWithoutViewScope",
    async (payload, thunkAPI) => {
        const res = await axios(getterConfig).post("/Assignment/GetAssignmentByGuidWithoutViewScope", payload);
        return res;
    }
);

export const getAssignmentByGuidWithoutViewScopeAndQuestionnaire = createAsyncThunk(
    "assignment/GetAssignmentByGuidWithoutViewScopeAndQuestionnaire",
    async (payload, thunkAPI) => {
        const res = await axios(getterConfig).post("/Assignment/GetAssignmentByGuidWithoutViewScopeAndQuestionnaire", payload);
        return res;
    }
);

export const getAssignmentByGuidWithoutViewScopeAndQuestionnaireAndQCLog = createAsyncThunk(
    "assignment/GetAssignmentByGuidWithoutViewScopeAndQuestionnaireAndQCLog",
    async (payload, thunkAPI) => {
        const res = await axios(getterConfig).post("/Assignment/GetAssignmentByGuidWithoutViewScopeAndQuestionnaireAndQCLog", payload);
        return res;
    }
);

export const getHouseHoldAssignmentByStaffPositionUidByPageTotalCount = createAsyncThunk(
    "assignment/GetHouseHoldAssignmentByStaffPositionUidByPageTotalCount",
    async (payload, thunkAPI) => {
        const res = await axios(getterConfig).post("/Assignment/GetHouseHoldAssignmentByStaffPositionUidByPageTotalCount", payload);
        return res;
    }
);

export const getAssignmentListByStaffPositionUidByPageBasicTotalCount = createAsyncThunk(
    "assignment/GetAssignmentListByStaffPositionUidByPageBasicTotalCount",
    async (payload, thunkAPI) => {
        const res = await axios(getterConfig).post("/Assignment/GetAssignmentListByStaffPositionUidByPageBasicTotalCount", payload);
        return res;
    }
);

export const getAssignmentListByStaffPositionUidByPageTotalCount = createAsyncThunk(
    "assignment/GetAssignmentListByStaffPositionUidByPageTotalCount",
    async (payload, thunkAPI) => {
        const res = await axios(getterConfig).post("/Assignment/GetAssignmentListByStaffPositionUidByPageTotalCount", payload);
        return res;
    }
);

/**
 * @typedef {Object} Assignment
 * @property {Array<{RecordState: string, ASGN_UID: number, ASGN_GUID: string, ACTY_UID: number, ACTY_CD: string, SRVY_UID: number, OTH_DESCR: string, SEL_APRV_POSN_UID: number, SEL_APRV_POSN_CD: string, SEL_APRV_POSN_NAME_ENG: string, SEL_APRV_POSN_NAME_CHI: string, APRV_POSN_UID: number, APRV_POSN_CD: string, APRV_POSN_NAME_ENG: string, APRV_POSN_NAME_CHI: string, APRV_RMKS: string, RJCT_RSN: string}>} cm_asgn_acty_setList
 * @property {Array<{RecordState: string, ASGN_UID: number, ASGN_GUID: string, ALLOC_TYP: string, POSN_UID_CET: number, OU_UID_CET: number, STF_POSN_UID_CET: number, POSN_CD_CET: string, OU_CD_CET: string, OU_TYP_CD_CET: string, POSN_UID_FU: number, OU_UID_FU: number, STF_POSN_UID_FU: number, POSN_CD_FU: string, OU_CD_FU: string, OU_TYP_CD_FU: string}>} cm_asgn_alloc_setList
 * @property {Array<{RecordState: string, HH_CONT_UID: number, ASGN_UID: number, ASGN_GUID: string, SEQ_NO: number, GUID: string, ENQ_IND: string, INTV_IND: string, APPT_IND: string, APPT_REQR_IND: string, TITL: string, ADDR_ENG: string, ADDR_CHI: string, SURN_ENG: string, OTHN_ENG: string, SURN_CHI: string, OTHN_CHI: string, NAME_ENG: string, NAME_CHI: string, TEL_1: string, TEL_EXT_1: string, TEL_2: string, TEL_EXT_2: string, EML: string, EML_IND: string, RMKS: string, PREF_TIME: string, CONT_METH_PREF: string, DFLT_CONT_IND: string, WRG_TEL_NO_IND: string, WRG_TEL_RPT_BY: string, INT_OQ_IND: string, RESPT_LNG: string, RFSL_IND: string, RFSL_LVL: number, LINK_ID: string}>} cm_asgn_hh_cont_setList
 * @property {Array<{RecordState: string, ASGN_UID: number, ASGN_GUID: string, HLD_TYP: string, HLD_RSN: string, HLD_STS: string}>} cm_asgn_hld_lst_setList
 * @property {Array<{RecordState: string, ASGN_UID: number, GUID: string, QTR_UID: string, HH_NO: number, ESTB_UID: number, OS: string, SC_UID: number, MAIN_ASGN_UID: number, SRC_ASGN_UID: number, PREV_ASGN_UID: number, FRM_TYP: string, CASE_TYP: string, ASGN_SRC: string, ASGN_STS: string, STP_UID: number, ASGN_STG_IND: string, ENUM_RSLT_CD: string, VST_RSLT_CD: string, VST_RSLT_RMKS: string, VST_DT: string, HD_SQUTR_CTRL_NO: string, SP_IND: string, NFA_IND: string, OCP_IND: string, UE_IND: string, NC_IND: string, RFSL_IND: string, RFSL_LVL: number, NFV_IND: string, NR_RMKS: string, NRC_IND: string, DC_RTN_MDE: string, DC_CMPL_BY_STF_POSN_UID: number, DC_CMPL_DT: string, FU_IND: string, FU_RTN_MDE: string, FU_CRE_DT: string, FU_CMPL_BY_STF_POSN_UID: number, FU_CMPL_DT: string, SEL_APRV_POSN_UID: number, ASGN_TO_POSN_UID: number, SMS_IND: string, APRV_RMKS: string}>} cm_asgn_main_setList
 * @property {Array<{RecordState: string, ASGN_UID: number, MAP_TYP: string, FILE_NAME: string, FILE_PATH: string, IMG_BASE64: string, GUID: string, IS_SAMP: string, RMKS: string, STS: string}>} cm_asgn_map_setList
 * @property {Array<{RecordState: string, ASGN_UID: number, FLD_ID: string, FLD_VAL: string}>} cm_asgn_ref_no_setList
 * @property {Array<{RecordState: string, ASGN_RMKS_UID: number, GUID: string, ASGN_UID: number, ASGN_GUID: string, RMKS_CATG: string, ASGN_RMKS: string}>} cm_asgn_rmk_setList
 * @property {Array<{RecordState: string, ASGN_UID: number, LTR_PRN_IND: string, LTR_ISS_IND: string, LTR_ISS_DT: string, MAIL_RJCT_DT: string, MAIL_RJCT_RSN: string, RMDR_PRN_IND: string, RMDR_ISS_IND: string, RMDR_ISS_DT: string}>} cm_asgn_ltr_setList
 * @property {Array<{RecordState: string, STF_UID: number, SYS_CD: string, ASGN_UID: number, ASGN_GUID: string, RMKS: string, STS: string}>} cm_usr_asgn_bkm_setList
 * @property {Array<{RecordState: string, GUID: string, APRV_REQ_UID: number, ASGN_UID: number, ASGN_GUID: string, REQ_BY_STF_UID: number, REQ_BY_STF_NO: string, REQ_BY_STF_NAME_ENG: string, REQ_BY_STF_NAME_CHI: string, REQ_BY_POSN_UID: number, REQ_BY_POSN_CD: string, REQ_BY_POSN_NAME_ENG: string, REQ_BY_POSN_NAME_CHI: string, REQ_DT: string, REQ_RMKS: string, SEL_APRV_STF_UID: number, SEL_APRV_STF_NO: string, SEL_APRV_STF_NAME_ENG: string, SEL_APRV_STF_NAME_CHI: string, SEL_APRV_POSN_UID: number, SEL_APRV_POSN_CD: string, SEL_APRV_POSN_NAME_ENG: string, SEL_APRV_POSN_NAME_CHI: string, APRV_STF_UID: number, APRV_STF_NO: string, APRV_STF_NAME_ENG: string, APRV_STF_NAME_CHI: string, APRV_POSN_UID: number, APRV_POSN_CD: string, APRV_POSN_NAME_ENG: string, APRV_POSN_NAME_CHI: string, APRV_STS: string, APRV_DT: string, APRV_RMKS: string}>} cm_asgn_aprv_req_setList
 */

export const updateAssignment = createAsyncThunk(
    "assignment/UpdateAssignment",
    /**
     * 
     * @param {Assignment} payload 
     * @param {*} thunkAPI 
     * @returns {{}}
     */
    async (payload, thunkAPI) => {
        const res = await axios(setterConfig).post("/Assignment/UpdateAssignment", payload);
        return res;
    }
);

export const getQuestionnaireByStaffUid = createAsyncThunk(
    "assignment/GetQuestionnaireByStaffUid",
    async (payload, thunkAPI) => {
        const res = await axios(getterConfig).post("/GetQuestionnaireByStaffUid", payload);
        return res;
    }
);

export const cloneSubAssignment = createAsyncThunk(
    "assignment/CloneSubAssignment",
    async (payload, thunkAPI) => {
        const res = await axios(setterConfig).post("/Assignment/CloneSubAssignment", payload);
        return res;
    }
);

export const downloadAssignment = createAsyncThunk(
    "assignment/SetDownloadRecord",
    async (payload, thunkAPI) => {
        const res = await axios(setterConfig).post("/Master/SetDownloadRecord", payload);
        return res;
    }
);

export const updateAssignmentStatus = createAsyncThunk(
    "assignment/UpdateAssignmentStatus",
    async (payload, thunkAPI) => {
        Object.keys(payload).forEach(item => {
            if (payload[item] == 'I') delete payload[item]
        })
        const res = await axios(setterConfig).post("/Assignment/UpdateAssignmentStatus", payload);
        return res;
    }
);

export const getSubmittedAssignmentByApproverStaffUidByPage = createAsyncThunk(
    "assignment/GetSubmittedAssignmentByApproverStaffUidByPage",
    async (payload, thunkAPI) => {
        const res = await axios(getterConfig).post("/Assignment/GetSubmittedAssignmentByApproverStaffUidByPage", payload);
        return res;
    }
);

export const getSubmittedAssignmentByApproverStaffPositionUidByPage = createAsyncThunk(
    "assignment/GetSubmittedAssignmentByApproverStaffPositionUidByPage",
    async (payload, thunkAPI) => {
        const res = await axios(getterConfig).post("/Assignment/GetSubmittedAssignmentByApproverStaffPositionUidByPage", payload);
        return res;
    }
);

export const getAssignmentResponsibleStaff = createAsyncThunk(
    "assignment/GetAssignmentResponsibleStaff",
    async (payload, thunkAPI) => {
        const res = await axios(getterConfig).post("/Assignment/GetAssignmentResponsibleStaff", payload);
        return res;
    }
);

export const getCodingEditingOverviewByPage = createAsyncThunk(
    "assignment/getCodingEditingOverviewByPage",
    async (payload, thunkAPI) => {
        const res = await axios(getterConfig).post("/CodingEditing/GetCodingEditingOverviewByPage", payload);
        return res;
    }
);

export const getAllocatedCodingEditingByStaffPositionUidByPage = createAsyncThunk(
    "assignment/getAllocatedCodingEditingByStaffPositionUidByPage",
    async (payload, thunkAPI) => {
        const res = await axios(getterConfig).post("/CodingEditing/GetAllocatedCodingEditingByStaffPositionUidByPage", payload);
        return res;
    }
);

export const getTeamStaffBySupervisorStaffPositionUid = createAsyncThunk(
    "assignment/getTeamStaffBySupervisorStaffPositionUid",
    async (payload, thunkAPI) => {
        const res = await axios(getterConfig).post("/Master/GetTeamStaffBySupervisorStaffPositionUid", payload);
        return res;
    }
);

export const getCodingEditingDetailByAssignmentUid = createAsyncThunk(
    "assignment/getCodingEditingDetailByAssignmentUid",
    async (payload, thunkAPI) => {
        const res = await axios(getterConfig).post("/CodingEditing/GetCodingEditingDetailByAssignmentUid", payload);
        return res;
    }
);

export const getAssignmentInfoListByStaffUid = createAsyncThunk(
    "assignment/getAssignmentInfoListByStaffPositionUid",
    async (payload, thunkAPI) => {
        const res = await axios(getterConfig).post("Assignment/GetAssignmentInfoListByStaffPositionUid", payload);
        return res;
    }
);

export const getHouseHoldAssignmentByStaffPositionUidByPage = createAsyncThunk(
    "assignment/getHouseHoldAssignmentByStaffPositionUidByPage",
    async (payload, thunkAPI) => {
        const res = await axios(getterConfig).post("Assignment/GetHouseHoldAssignmentByStaffPositionUidByPage", payload);
        return res;
    }
);
export const getAssignmentHouseHoldContactByAssignmentGuid = createAsyncThunk(
    "assignment/getAssignmentHouseHoldContactByAssignmentGuid",
    async (payload, thunkAPI) => {
        const res = await axios(getterConfig).post("Assignment/GetAssignmentHouseHoldContactByAssignmentGuid", payload);
        return res;
    }
);
export const getHouseholdAssignmentListDetailAssignmentListContactListOption = createAsyncThunk(
    "assignment/getHouseholdAssignmentListDetailAssignmentListContactListOption",
    async (payload, thunkAPI) => {
        const res = await axios(getterConfig).post("Assignment/GetHouseholdAssignmentListDetailAssignmentListContactListOption", payload);
        return res;
    }
);
export const getAssignmentInfoByGuid = createAsyncThunk(
    "assignment/getAssignmentInfoByGuid",
    async (payload, thunkAPI) => {
        const res = await axios(getterConfig).post("Assignment/GetAssignmentInfoByGuid", payload);
        return res;
    }
);

export const getAssignmentByPage = createAsyncThunk(
    "assignment/getAssignmentByPage",
    async (payload, thunkAPI) => {
        const res = await axios(getterConfig).post("Assignment/GetAssignmentByPage", payload);
        return res;
    }
);

export const getOutstandingAssignmentBySrvyUID = createAsyncThunk(
    "assignment/getOutstandingAssignmentBySrvyUID",
    async (payload, thunkAPI) => {
        const res = await axios(getterConfig).post("Assignment/GetOutstandingAssignmentBySrvyUID", payload);
        return res;
    }
);

export const setHouseHoldEnquiry = createAsyncThunk(
    "assignment/SetHouseHoldEnquiry",
    async (payload, thunkAPI) => {
        const res = await axios(setterConfig).post("/Assignment/SetHouseHoldEnquiry", payload);
        return res;
    }
);

export const getCETTeamStaffBySupervisorStaffPositionUid = createAsyncThunk(
    "assignment/getCETTeamStaffBySupervisorStaffPositionUid",
    async (payload, thunkAPI) => {
        const res = await axios(getterConfig).post("/Master/GetCETTeamStaffBySupervisorStaffPositionUid", payload);
        return res;
    }
);

export const renameAssignmentGroup = createAsyncThunk(
    "assignment/renameAssignmentGroup",
    async (payload, thunkAPI) => {
        const res = await axios(getterConfig).post("/Assignment/RenameAssignmentGroup", payload);
        return res;
    }
);

export const setAssignmentGroup = createAsyncThunk(
    "assignment/setAssignmentGroup",
    async (payload, thunkAPI) => {
        const res = await axios(getterConfig).post("/Assignment/SetAssignmentGroup", payload);
        return res;
    }
);

export const deleteAssignmentFromAssignmentGroup = createAsyncThunk(
    "assignment/deleteAssignmentFromAssignmentGroup",
    async (payload, thunkAPI) => {
        const res = await axios(getterConfig).post("/Assignment/DeleteAssignmentFromAssignmentGroup", payload);
        return res;
    }
);

export const deleteAssignmentGroup = createAsyncThunk(
    "assignment/deleteAssignmentGroup",
    async (payload, thunkAPI) => {
        const res = await axios(getterConfig).post("/Assignment/DeleteAssignmentGroup", payload);
        return res;
    }
);

//Action Reducer
const assignmentSlice = createSlice({
    name: 'assignment',
    initialState,
    reducers: {

    },
    extraReducers: (builder) => {
        builder
            .addCase(getAssignmentListFilter.fulfilled, (state, action) => {
                state.filterData = {
                    ...state.filterData,
                    status: action.payload.data.StatusList?.map(item => {
                        return { value: item, label: item }
                    }),
                    surveyType: action.payload.data.SurveyTypeList?.map(item => {
                        return { value: item, label: item }
                    }),
                }
            })
            .addCase(getAssignmentByStaffUidByPage.fulfilled, (state, action) => {
                // const result = action.payload.data.AssginmentList?.map(item => {
                //     return {
                //         ...item,
                //         English_Full_Address: item.FLAT + " " + item.FLR + " " + item.BLK + ", " + item.MAIL_ADDR_ENG_1 + " " + item.MAIL_ADDR_ENG_2 + " " + item.MAIL_ADDR_ENG_3 + " " + item.MAIL_ADDR_ENG_4 + " " + item.MAIL_ADDR_ENG_5,
                //         UUID: uuid(),
                //     }
                // });
                // if (result.length > 0) {
                //     addData('DCP', 'assignment', result, 'UUID', true).then(data => {
                //     })
                // }
            })
            .addCase(updateState.fulfilled, (state, action) => {
                if (typeof action.payload.value == 'object') {
                    state[action.payload.key] = {
                        ...state[action.payload.key],
                        ...action.payload.value
                    }
                }
                else {
                    state[action.payload.key] = action.payload.value
                }
            })
            .addCase(getAssignmentHouseHoldContactByStaffUid.fulfilled, (state, action) => {
            })
            .addCase(getAssignmentEnquiryByPage.fulfilled, (state, action) => {
                state.assignmentData = action.payload.data.assignmentEnquiry?.map(item => ({
                    ...item,
                    English_Full_Address: [item.MAIL_ADDR_ENG_1, item.MAIL_ADDR_ENG_2, item.MAIL_ADDR_ENG_3, item.MAIL_ADDR_ENG_4, item.MAIL_ADDR_ENG_5, item.MAIL_ADDR_ENG_6].filter(add => add && add != '').join(', '),
                    Chinese_Full_Address: [item.MAIL_ADDR_CHI_1, item.MAIL_ADDR_CHI_2, item.MAIL_ADDR_CHI_3, item.MAIL_ADDR_CHI_4, item.MAIL_ADDR_CHI_5, item.MAIL_ADDR_CHI_6].filter(add => add && add != '').join(', '),
                }))

                state.totalCount = action.payload.data.TotalCount
            })
            .addCase(getEnquiryStaffList.fulfilled, (state, action) => {
                state.officerList = action.payload.data.enquiryStaffList
                state.officerTotalCount = action.payload.data.TotalCount
            })
            .addCase(getAssignmentDetail.fulfilled, (state, action) => {
            })
            .addCase(updateAssignment.fulfilled, (state, action) => {
            })
            .addCase(getQuestionnaireByStaffUid.fulfilled, (state, action) => {
            })
            .addCase(cloneSubAssignment.fulfilled, (state, action) => {
            })
            .addCase(downloadAssignment.fulfilled, (state, action) => {
            })
            .addCase(updateAssignmentStatus.fulfilled, (state, action) => {
            })
            .addCase(getSubmittedAssignmentByApproverStaffUidByPage.fulfilled, (state, action) => {
                state.assignmentData = action.payload.data.assignment?.map(item => ({
                    ...item,
                    English_Full_Address: [item.MAIL_ADDR_ENG_1, item.MAIL_ADDR_ENG_2, item.MAIL_ADDR_ENG_3, item.MAIL_ADDR_ENG_4, item.MAIL_ADDR_ENG_5, item.MAIL_ADDR_ENG_6].filter(add => add && add != '').join(', '),
                    Chinese_Full_Address: [item.MAIL_ADDR_CHI_1, item.MAIL_ADDR_CHI_2, item.MAIL_ADDR_CHI_3, item.MAIL_ADDR_CHI_4, item.MAIL_ADDR_CHI_5, item.MAIL_ADDR_CHI_6].filter(add => add && add != '').join(', '),
                }))

                state.totalCount = action.payload.data.TotalCount
            })
            .addCase(getSubmittedAssignmentByApproverStaffPositionUidByPage.fulfilled, (state, action) => {
                state.assignmentData = action.payload.data.assignment?.map(item => ({
                    ...item,
                    English_Full_Address: [item.MAIL_ADDR_ENG_1, item.MAIL_ADDR_ENG_2, item.MAIL_ADDR_ENG_3, item.MAIL_ADDR_ENG_4, item.MAIL_ADDR_ENG_5, item.MAIL_ADDR_ENG_6].filter(add => add && add != '').join(', '),
                    Chinese_Full_Address: [item.MAIL_ADDR_CHI_1, item.MAIL_ADDR_CHI_2, item.MAIL_ADDR_CHI_3, item.MAIL_ADDR_CHI_4, item.MAIL_ADDR_CHI_5, item.MAIL_ADDR_CHI_6].filter(add => add && add != '').join(', '),
                }))

                state.totalCount = action.payload.data.TotalCount
            })
            .addCase(getAssignmentResponsibleStaff.fulfilled, (state, action) => {
                state.officerList = action.payload.data.staffList
                state.officerTotalCount = action.payload.data.TotalCount
            })
            .addCase(getCodingEditingOverviewByPage.fulfilled, (state, action) => {
                state.assignmentData = action.payload.data.codingEditingList
                state.totalCount = action.payload.data.TotalCount
            })
            .addCase(getAllocatedCodingEditingByStaffPositionUidByPage.fulfilled, (state, action) => {
                state.assignmentData = action.payload.data.codingEditingList
                state.totalCount = action.payload.data.TotalCount
            })
            .addCase(getTeamStaffBySupervisorStaffPositionUid.fulfilled, (state, action) => {
            })
            .addCase(getAssignmentInfoListByStaffUid.fulfilled, (state, action) => {
            })
            .addCase(getHouseHoldAssignmentByStaffPositionUidByPage.fulfilled, (state, action) => {
                state.assignmentData = action.payload.data.assignmentList
                // state.totalCount = action.payload.data.TotalCount
            })
            .addCase(getHouseHoldAssignmentByStaffPositionUidByPageTotalCount.fulfilled, (state, action) => {
                state.totalCount = action.payload.data.TotalCount
            })
            .addCase(getAssignmentListByStaffPositionUidByPageBasicTotalCount.fulfilled, (state, action) => {
                state.totalCount = action.payload.data.TotalCount
            })
            .addCase(getAssignmentListByStaffPositionUidByPageTotalCount.fulfilled, (state, action) => {
                state.totalCount = action.payload.data.TotalCount
            })
    }
})


export default assignmentSlice.reducer